import type { IncomingMessage, ServerResponse } from 'node:http';

const PRODUCT_IDS = new Set([
  'prod_21PIYy2aAeG6y2B3Zjul2a',
  'prod_7jeTFbEys6FrrBstowAJuL',
  'prod_4DP5C2BFo9HZM8K32SqKXl',
]);

type CheckoutRequest = {
  organization_id?: string;
  product_id?: string;
  success_url?: string;
};

type SupabaseConfig = { url: string; serviceRoleKey: string };

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/$/, ''), serviceRoleKey };
}

async function readJsonBody(req: IncomingMessage): Promise<CheckoutRequest> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) as CheckoutRequest : {};
}

function setCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const allowed = origin === 'https://yasaflow.com' || origin === 'https://www.yasaflow.com' || origin.endsWith('.yasaflow.com');
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function getAuthenticatedUser(config: SupabaseConfig, authorization: string): Promise<{ id: string; email?: string } | null> {
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.serviceRoleKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = await response.json() as { id?: string; email?: string };
  return user.id ? { id: user.id, email: user.email } : null;
}

async function userCanManageOrganization(config: SupabaseConfig, userId: string, organizationId: string): Promise<boolean> {
  const query = new URLSearchParams({
    select: 'id',
    organization_id: `eq.${organizationId}`,
    user_id: `eq.${userId}`,
    invitation_status: 'eq.accepted',
    limit: '1',
  });
  const response = await fetch(`${config.url}/rest/v1/organization_admins?${query}`, {
    headers: { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` },
  });
  if (!response.ok) return false;
  return ((await response.json()) as unknown[]).length > 0;
}

function allowedSuccessUrl(value: string | undefined): string {
  const fallback = 'https://www.yasaflow.com/login?payment=success';
  if (!value) return fallback;
  try {
    const url = new URL(value);
    const allowedHosts = new Set(['yasaflow.vercel.app', 'yasaflow.com', 'www.yasaflow.com']);
    return url.protocol === 'https:' && allowedHosts.has(url.hostname) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export default async function handler(req: IncomingMessage & { method?: string; headers: IncomingMessage['headers'] }, res: ServerResponse): Promise<void> {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.CREEM_API_KEY;
  const config = getSupabaseConfig();
  if (!apiKey || !config) return sendJson(res, 500, { error: 'Server configuration is incomplete' });

  const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  if (!authorization.startsWith('Bearer ')) return sendJson(res, 401, { error: 'Authentication required' });

  let body: CheckoutRequest;
  try { body = await readJsonBody(req); }
  catch { return sendJson(res, 400, { error: 'Invalid JSON body' }); }

  const organizationId = body.organization_id?.trim();
  const productId = body.product_id?.trim();
  if (!organizationId || !productId || !PRODUCT_IDS.has(productId)) {
    return sendJson(res, 400, { error: 'Invalid organization or product' });
  }

  const user = await getAuthenticatedUser(config, authorization);
  if (!user || !(await userCanManageOrganization(config, user.id, organizationId))) {
    return sendJson(res, 403, { error: 'You cannot manage billing for this organization' });
  }

  const creemBaseUrl = apiKey.startsWith('creem_test_') ? 'https://test-api.creem.io' : 'https://api.creem.io';
  const response = await fetch(`${creemBaseUrl}/v1/checkouts`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      request_id: `${organizationId}:${productId}:${Date.now()}`,
      success_url: allowedSuccessUrl(body.success_url),
      customer: user.email ? { email: user.email } : undefined,
      metadata: { organization_id: organizationId, user_id: user.id, product_id: productId },
    }),
  });

  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    console.error('Creem checkout creation failed:', response.status, payload);
    return sendJson(res, 502, { error: 'Kunne ikke opprette betaling.' });
  }

  sendJson(res, 200, { checkout_id: payload?.id ?? null, checkout_url: payload?.checkout_url ?? null });
}
