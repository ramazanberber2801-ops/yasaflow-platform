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

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type PaddleDetails = {
  organizationId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  transactionId: string | null;
  priceIds: string[];
  providerStatus: string | null;
};

const MAX_SIGNATURE_AGE_SECONDS = 300;
const MAX_BODY_BYTES = 1024 * 1024;
const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,160}$/;
const EVENT_TYPE_PATTERN = /^(subscription|transaction)\.[a-z0-9_]+$/;
const ORGANIZATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,120}$/;

const PRICE_IDS = {
  core: 'pri_01kxq49nngz9sc8yhrpp7kaytd',
  push: 'pri_01kxq4pdmtz6hbzmmvv63rrxrq',
  donation: 'pri_01kxq4tgkbrex6chzrrnw4dnaw',
} as const;

const MODULE_BY_PRICE_ID: Record<string, string> = {
  [PRICE_IDS.push]: 'push',
  [PRICE_IDS.donation]: 'donation',
};

function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on('data', (chunk) => {
      if (settled) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;
      if (totalBytes > MAX_BODY_BYTES) {
        fail(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on('error', fail);
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
      if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
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

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/$/, ''), serviceRoleKey };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function validateEvent(event: PaddleEvent): string | null {
  if (!event.event_id || !EVENT_ID_PATTERN.test(event.event_id)) return 'Invalid event_id';
  if (!event.event_type || !EVENT_TYPE_PATTERN.test(event.event_type)) return 'Invalid event_type';
  if (!asRecord(event.data)) return 'Invalid event data';
  if (event.occurred_at && Number.isNaN(Date.parse(event.occurred_at))) return 'Invalid occurred_at';
  return null;
}

function extractPriceIds(data: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const items = Array.isArray(data.items) ? data.items : [];

  for (const itemValue of items) {
    const item = asRecord(itemValue);
    if (!item) continue;
    const price = asRecord(item.price);
    const priceId = asString(price?.id) ?? asString(item.price_id);
    if (priceId) ids.add(priceId);
  }

  const directPriceId = asString(data.price_id);
  if (directPriceId) ids.add(directPriceId);

  return [...ids];
}

function extractDetails(event: PaddleEvent): PaddleDetails {
  const data = asRecord(event.data) ?? {};
  const customData = asRecord(data.custom_data) ?? {};
  const rawOrganizationId =
    asString(customData.organization_id) ??
    asString(customData.organizationId) ??
    asString(data.organization_id);

  return {
    organizationId:
      rawOrganizationId && ORGANIZATION_ID_PATTERN.test(rawOrganizationId)
        ? rawOrganizationId
        : null,
    customerId: asString(data.customer_id),
    subscriptionId: asString(data.subscription_id) ?? asString(data.id),
    transactionId:
      event.event_type?.startsWith('transaction.') === true
        ? asString(data.id)
        : asString(data.transaction_id),
    priceIds: extractPriceIds(data),
    providerStatus: asString(data.status),
  };
}

async function supabaseRequest(
  config: SupabaseConfig,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function organizationExists(
  config: SupabaseConfig,
  organizationId: string,
): Promise<boolean> {
  const response = await supabaseRequest(
    config,
    `organizations?select=id&id=eq.${encodeURIComponent(organizationId)}&limit=1`,
  );
  if (!response.ok) return false;
  const rows = (await response.json()) as Array<{ id?: string }>;
  return rows[0]?.id === organizationId;
}

async function findOrganizationId(
  config: SupabaseConfig,
  details: PaddleDetails,
): Promise<string | null> {
  if (details.organizationId) {
    return (await organizationExists(config, details.organizationId))
      ? details.organizationId
      : null;
  }

  const lookups: Array<[string, string | null]> = [
    ['paddle_subscription_id', details.subscriptionId],
    ['paddle_customer_id', details.customerId],
  ];

  for (const [column, value] of lookups) {
    if (!value) continue;
    const response = await supabaseRequest(
      config,
      `organizations?select=id&${column}=eq.${encodeURIComponent(value)}&limit=1`,
    );
    if (!response.ok) continue;
    const rows = (await response.json()) as Array<{ id?: string }>;
    if (rows[0]?.id) return rows[0].id;
  }

  return null;
}

function mapSubscriptionStatus(
  eventType: string,
  providerStatus: string | null,
): 'active' | 'cancelled' | 'past_due' | 'expired' | null {
  if (eventType === 'subscription.canceled') return 'cancelled';
  if (eventType === 'subscription.past_due') return 'past_due';
  if (eventType === 'transaction.payment_failed') return 'past_due';

  switch (providerStatus) {
    case 'active':
    case 'trialing':
    case 'completed':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'cancelled';
    case 'paused':
      return 'expired';
    default:
      return eventType === 'transaction.completed' ? 'active' : null;
  }
}

async function updateOrganization(
  config: SupabaseConfig,
  organizationId: string,
  eventType: string,
  details: PaddleDetails,
): Promise<void> {
  const hasCorePrice = details.priceIds.includes(PRICE_IDS.core);
  const subscriptionEvent = eventType.startsWith('subscription.');
  const shouldUpdateSubscriptionStatus = subscriptionEvent || hasCorePrice;
  const mappedStatus = shouldUpdateSubscriptionStatus
    ? mapSubscriptionStatus(eventType, details.providerStatus)
    : null;

  const patch: Record<string, unknown> = {
    subscription_updated_at: new Date().toISOString(),
  };

  if (details.customerId) patch.paddle_customer_id = details.customerId;
  if (details.subscriptionId) patch.paddle_subscription_id = details.subscriptionId;
  if (details.transactionId) patch.paddle_transaction_id = details.transactionId;
  if (details.priceIds.length > 0) patch.paddle_price_ids = details.priceIds;
  if (mappedStatus) patch.subscription_status = mappedStatus;
  if (hasCorePrice) patch.subscription_plan = 'core';

  const response = await supabaseRequest(
    config,
    `organizations?id=eq.${encodeURIComponent(organizationId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    },
  );

  if (!response.ok) {
    throw new Error(`Organization update failed: ${response.status} ${await response.text()}`);
  }
}

async function setModuleEnabled(
  config: SupabaseConfig,
  organizationId: string,
  moduleId: string,
  enabled: boolean,
): Promise<void> {
  const response = await supabaseRequest(
    config,
    `organization_modules?organization_id=eq.${encodeURIComponent(organizationId)}&module_id=eq.${encodeURIComponent(moduleId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        enabled,
        status: enabled ? 'På' : 'Av',
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Module update failed: ${response.status} ${await response.text()}`);
  }

  const updatedRows = (await response.json()) as unknown[];
  if (updatedRows.length > 0) return;

  const createResponse = await supabaseRequest(config, 'organization_modules', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      organization_id: organizationId,
      module_id: moduleId,
      enabled,
      status: enabled ? 'På' : 'Av',
      updated_at: new Date().toISOString(),
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Module creation failed: ${createResponse.status} ${await createResponse.text()}`);
  }
}

async function updatePaidModules(
  config: SupabaseConfig,
  organizationId: string,
  eventType: string,
  details: PaddleDetails,
): Promise<void> {
  const disableAll =
    eventType === 'subscription.canceled' ||
    eventType === 'subscription.past_due' ||
    eventType === 'transaction.payment_failed' ||
    details.providerStatus === 'canceled' ||
    details.providerStatus === 'past_due' ||
    details.providerStatus === 'paused';

  if (disableAll) {
    await Promise.all([
      setModuleEnabled(config, organizationId, 'push', false),
      setModuleEnabled(config, organizationId, 'donation', false),
    ]);
    return;
  }

  if (eventType === 'subscription.updated' || eventType === 'subscription.created') {
    await Promise.all([
      setModuleEnabled(config, organizationId, 'push', details.priceIds.includes(PRICE_IDS.push)),
      setModuleEnabled(
        config,
        organizationId,
        'donation',
        details.priceIds.includes(PRICE_IDS.donation),
      ),
    ]);
    return;
  }

  for (const priceId of details.priceIds) {
    const moduleId = MODULE_BY_PRICE_ID[priceId];
    if (moduleId) await setModuleEnabled(config, organizationId, moduleId, true);
  }
}

async function storeEvent(
  config: SupabaseConfig,
  event: PaddleEvent,
  organizationId: string | null,
): Promise<void> {
  const response = await supabaseRequest(config, 'paddle_webhook_events', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({
      event_id: event.event_id,
      event_type: event.event_type,
      occurred_at: event.occurred_at ?? new Date().toISOString(),
      organization_id: organizationId,
      payload: event,
    }),
  });

  if (!response.ok) {
    console.warn('Paddle event persistence failed:', response.status, await response.text());
  }
}

async function processPaddleEvent(event: PaddleEvent): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase server configuration is missing');

  const eventType = event.event_type as string;
  const details = extractDetails(event);
  const organizationId = await findOrganizationId(config, details);

  await storeEvent(config, event, organizationId);

  if (!organizationId) {
    console.warn('Verified Paddle event could not be linked to an organization:', eventType, event.event_id);
    return;
  }

  await updateOrganization(config, organizationId, eventType, details);
  await updatePaidModules(config, organizationId, eventType, details);
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
  },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const contentLengthHeader = req.headers['content-length'];
  const contentLength = Array.isArray(contentLengthHeader)
    ? Number(contentLengthHeader[0])
    : Number(contentLengthHeader);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    sendJson(res, 413, { error: 'Payload too large' });
    return;
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET is not configured');
    sendJson(res, 500, { error: 'Webhook is not configured' });
    return;
  }

  const headerValue = req.headers['paddle-signature'];
  const signatureHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!signatureHeader) {
    sendJson(res, 400, { error: 'Missing Paddle-Signature header' });
    return;
  }

  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'Payload too large' });
      return;
    }
    sendJson(res, 400, { error: 'Unable to read request body' });
    return;
  }

  if (!verifyPaddleSignature(rawBody, signatureHeader, webhookSecret)) {
    sendJson(res, 401, { error: 'Invalid webhook signature' });
    return;
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody.toString('utf8')) as PaddleEvent;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload' });
    return;
  }

  const validationError = validateEvent(event);
  if (validationError) {
    sendJson(res, 400, { error: validationError });
    return;
  }

  try {
    await processPaddleEvent(event);
    console.info('Processed Paddle webhook:', event.event_type, event.event_id);
    sendJson(res, 200, { received: true });
  } catch (error) {
    console.error('Paddle webhook processing failed:', error);
    sendJson(res, 500, { error: 'Webhook processing failed' });
  }
}
