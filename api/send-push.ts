import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey || !vapidPublicKey || !vapidPrivateKey) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const { title, body, url } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: 'Missing title or body' });
  }

  webpush.setVapidDetails(
    'mailto:admin@dtim.no',
    vapidPublicKey,
    vapidPrivateKey
  );

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || '/',
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    (data || []).map(async (row: any) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sent += 1;
      } catch {
        failed += 1;
      }
    })
  );

  return res.status(200).json({ ok: true, sent, failed });
}
