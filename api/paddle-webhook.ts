import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = {
  api: {
    bodyParser: false,
  },
};

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

const MAX_SIGNATURE_AGE_SECONDS = 300;

function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parsePaddleSignature(header: string): {
  timestamp: string | null;
  signatures: string[];
} {
  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const part of header.split(';')) {
    const [key, value] = part.trim().split('=', 2);
    if (!key || !value) continue;
    if (key === 'ts') timestamp = value;
    if (key === 'h1') signatures.push(value);
  }

  return { timestamp, signatures };
}

function verifyPaddleSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string,
): boolean {
  const { timestamp, signatures } = parsePaddleSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
  if (age > MAX_SIGNATURE_AGE_SECONDS) return false;

  const signedPayload = `${timestamp}:${rawBody.toString('utf8')}`;
  const expected = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return signatures.some((signature) => {
    try {
      const receivedBuffer = Buffer.from(signature, 'hex');
      return (
        receivedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(receivedBuffer, expectedBuffer)
      );
    } catch {
      return false;
    }
  });
}

async function optionallyStoreEvent(event: PaddleEvent): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Persistence is optional so the endpoint can be activated before the
  // paddle_webhook_events table is created. Signature verification is always required.
  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/paddle_webhook_events`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({
        event_id: event.event_id ?? null,
        event_type: event.event_type ?? 'unknown',
        occurred_at: event.occurred_at ?? new Date().toISOString(),
        payload: event,
      }),
    });

    if (!response.ok) {
      console.warn(
        'Paddle webhook was verified, but event persistence failed:',
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.warn('Paddle webhook persistence error:', error);
  }
}

export default async function handler(
  req: IncomingMessage & { method?: string; headers: Record<string, string | string[] | undefined> },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET is not configured');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Webhook is not configured' }));
    return;
  }

  const headerValue = req.headers['paddle-signature'];
  const signatureHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!signatureHeader) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing Paddle-Signature header' }));
    return;
  }

  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unable to read request body' }));
    return;
  }

  if (!verifyPaddleSignature(rawBody, signatureHeader, webhookSecret)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid webhook signature' }));
    return;
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody.toString('utf8')) as PaddleEvent;
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    return;
  }

  console.info('Verified Paddle webhook:', event.event_type, event.event_id);
  await optionallyStoreEvent(event);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ received: true }));
}
