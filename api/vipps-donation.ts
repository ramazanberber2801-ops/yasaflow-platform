import type { VercelRequest, VercelResponse } from '@vercel/node';

function fallbackVippsNumberUrl(vippsNumber: string) {
  return `https://www.vipps.no/i-vipps/vipps-nummer/?number=${encodeURIComponent(vippsNumber)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const vippsNumber = String(req.body?.vippsNumber || process.env.VIPPS_NUMBER || '').trim();

  if (!vippsNumber) {
    return res.status(400).json({ error: 'Vipps number is required' });
  }

  // Safe first step: if the organisation has a stable Vipps payment/donation URL from Vipps,
  // store it in Vercel as VIPPS_DONATION_URL. This avoids exposing API secrets to the frontend.
  const configuredDonationUrl = String(process.env.VIPPS_DONATION_URL || '').trim();

  if (configuredDonationUrl) {
    return res.status(200).json({
      url: configuredDonationUrl,
      source: 'configured_donation_url',
    });
  }

  // Optional future full API integration. These values must stay server-side in Vercel env vars.
  // They are intentionally not accepted from frontend or public settings.
  const hasVippsApiConfig = Boolean(
    process.env.VIPPS_CLIENT_ID &&
    process.env.VIPPS_CLIENT_SECRET &&
    process.env.VIPPS_SUBSCRIPTION_KEY &&
    process.env.VIPPS_MERCHANT_SERIAL_NUMBER
  );

  if (hasVippsApiConfig) {
    return res.status(501).json({
      error: 'Vipps API credentials are configured, but full ePayment creation is not enabled yet.',
      fallbackUrl: fallbackVippsNumberUrl(vippsNumber),
    });
  }

  return res.status(200).json({
    url: fallbackVippsNumberUrl(vippsNumber),
    source: 'vipps_number_fallback',
  });
}
