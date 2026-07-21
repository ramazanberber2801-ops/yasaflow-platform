import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultOrganizationId = process.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

function setHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setHeaders(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseServiceRoleKey) return res.status(500).json({ error: 'Service configuration is unavailable' });

  const organizationId = String(req.query.organizationId || defaultOrganizationId).trim();
  if (!organizationId || organizationId.length > 120 || !/^[a-zA-Z0-9_-]+$/.test(organizationId)) {
    return res.status(400).json({ error: 'Invalid organizationId' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [settingsResult, newsResult] = await Promise.all([
    supabase
      .from('organization_settings')
      .select('display_name,short_name,description,address,map_url,phone,email,website,donation_number,donation_url,bank_account,iban,opening_hours,weekly_event,logo_url,app_icon_url,publish_phone,publish_email,publish_address,publish_website,publish_opening_hours')
      .eq('organization_id', organizationId)
      .maybeSingle(),
    supabase
      .from('organization_news')
      .select('id,title,summary,content,image_url,published_at')
      .eq('organization_id', organizationId)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(6),
  ]);

  const error = settingsResult.error || newsResult.error;
  if (error) {
    console.error('Public organization load failed', { organizationId, message: error.message });
    return res.status(500).json({ error: 'Public organization data could not be loaded' });
  }

  return res.status(200).json({
    organizationId,
    settings: settingsResult.data || null,
    news: newsResult.data || [],
  });
}
