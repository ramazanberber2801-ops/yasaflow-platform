import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fallbackVippsNumberUrl(vippsNumber: string) {
  return `https://www.vipps.no/i-vipps/vipps-nummer/?number=${encodeURIComponent(vippsNumber)}`;
}

function cleanUrl(value: unknown) {
  const url = String(value || '').trim();
  return url.startsWith('https://') ? url : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const vippsNumber = String(req.body?.vippsNumber || process.env.VIPPS_NUMBER || '').trim();

  if (!vippsNumber) {
    return res.status(400).json({ error: 'Vipps number is required' });
  }

  const configuredDonationUrl = cleanUrl(process.env.VIPPS_DONATION_URL);

  if (configuredDonationUrl) {
    return res.status(200).json({
      url: configuredDonationUrl,
      source: 'vercel_env_donation_url',
    });
  }

  if (supabaseUrl && supabaseServiceRoleKey) {
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data } = await serviceClient
      .from('settings')
      .select('vipps_donation_url')
      .limit(1)
      .maybeSingle();

    const dbDonationUrl = cleanUrl(data?.vipps_donation_url);

    if (dbDonationUrl) {
      return res.status(200).json({
        url: dbDonationUrl,
        source: 'settings_donation_url',
      });
    }
  }

  return res.status(200).json({
    url: fallbackVippsNumberUrl(vippsNumber),
    source: 'vipps_number_fallback',
  });
}
