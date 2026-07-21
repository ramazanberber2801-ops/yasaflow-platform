import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const defaultOrganizationId = process.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

function getBearerToken(req: VercelRequest) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return '';
  return authorization.slice('Bearer '.length).trim();
}

function pushStatusCode(error: unknown) {
  if (!error || typeof error !== 'object') return 0;
  const value = (error as { statusCode?: unknown }).statusCode;
  return typeof value === 'number' ? value : Number(value || 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseServiceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const { title, body, url, organizationId } = req.body || {};
  const cleanTitle = String(title || '').trim();
  const cleanBody = String(body || '').trim();
  if (!cleanTitle || !cleanBody) return res.status(400).json({ error: 'Missing title or body' });
  if (cleanTitle.length > 120 || cleanBody.length > 1000) return res.status(400).json({ error: 'Message is too long' });

  const targetOrganizationId = String(organizationId || defaultOrganizationId).trim();
  if (!targetOrganizationId) return res.status(400).json({ error: 'Missing organizationId' });

  const accessToken = getBearerToken(req);
  if (!accessToken) return res.status(401).json({ error: 'Authentication required' });

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  const userId = userData.user?.id;
  if (userError || !userId) return res.status(401).json({ error: 'Invalid administrator session' });

  const [{ data: organizationAdmin }, { data: platformAdmin }, { data: pushModule }] = await Promise.all([
    supabase
      .from('organization_admins')
      .select('id')
      .eq('organization_id', targetOrganizationId)
      .eq('user_id', userId)
      .eq('invitation_status', 'accepted')
      .in('role', ['admin', 'owner', 'super_admin', 'superadmin'])
      .maybeSingle(),
    supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', userId)
      .in('role', ['owner', 'super_admin', 'superadmin'])
      .maybeSingle(),
    supabase
      .from('organization_modules')
      .select('enabled')
      .eq('organization_id', targetOrganizationId)
      .eq('module_id', 'push')
      .maybeSingle(),
  ]);

  if (!organizationAdmin && !platformAdmin) {
    return res.status(403).json({ error: 'You do not have access to send notifications for this organization' });
  }

  if (!pushModule?.enabled) {
    return res.status(403).json({ error: 'Push notifications are not enabled for this organization' });
  }

  webpush.setVapidDetails('mailto:admin@yasaflow.com', vapidPublicKey, vapidPrivateKey);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: savedMessage, error: messageError } = await supabase
    .from('push_messages')
    .insert({ organization_id: targetOrganizationId, title: cleanTitle, body: cleanBody, expires_at: expiresAt })
    .select('id')
    .single();

  if (messageError || !savedMessage) {
    return res.status(500).json({ error: messageError?.message || 'Push message could not be saved' });
  }

  const messageId = savedMessage.id;
  const notificationUrl = url || `/?push_message=${messageId}`;
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('organization_id', targetOrganizationId);

  if (error) return res.status(500).json({ error: error.message });

  const payload = JSON.stringify({ title: cleanTitle, body: cleanBody, url: notificationUrl, message_id: messageId, organization_id: targetOrganizationId });
  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  await Promise.all((data || []).map(async (row: { id: string; subscription: webpush.PushSubscription }) => {
    try {
      await webpush.sendNotification(row.subscription, payload);
      sent += 1;
    } catch (sendError) {
      const statusCode = pushStatusCode(sendError);
      if (statusCode === 404 || statusCode === 410) {
        expiredIds.push(row.id);
      } else {
        failed += 1;
        console.error('Push delivery failed:', statusCode || 'unknown', sendError);
      }
    }
  }));

  let removed = 0;
  if (expiredIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('organization_id', targetOrganizationId)
      .in('id', expiredIds);

    if (deleteError) {
      console.error('Expired push subscriptions could not be removed:', deleteError);
      failed += expiredIds.length;
    } else {
      removed = expiredIds.length;
    }
  }

  return res.status(200).json({
    ok: true,
    sent,
    failed,
    removed,
    message_id: messageId,
    organization_id: targetOrganizationId,
  });
}
