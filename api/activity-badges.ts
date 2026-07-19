import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

const bearerToken = (req: VercelRequest) => {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

const renderPage = ({
  organizationName,
  activity,
  registrations,
}: {
  organizationName: string;
  activity: { id: string; title: string; activity_date: string; location: string | null; organization_id: string };
  registrations: Array<{ id: string; full_name: string; email: string; attendees: number; ticket_token: string; checked_in: boolean }>;
}) => {
  const date = new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const badges = registrations.flatMap((registration) => {
    const count = Math.max(1, Number(registration.attendees) || 1);
    const ticketValue = `yasaflow-ticket:${activity.organization_id}:${activity.id}:${registration.ticket_token}`;
    const qrUrl = `https://quickchart.io/qr?size=360&margin=1&text=${encodeURIComponent(ticketValue)}`;

    return Array.from({ length: count }, (_, index) => {
      const participantLabel = count > 1 ? `Deltaker ${index + 1} av ${count}` : 'Deltaker';
      return `<article class="badge">
        <div class="brand">${escapeHtml(organizationName)}</div>
        <div class="event">${escapeHtml(activity.title)}</div>
        <div class="name">${escapeHtml(registration.full_name)}</div>
        <div class="role">${participantLabel}</div>
        <div class="details">${escapeHtml(date)}${activity.location ? ` · ${escapeHtml(activity.location)}` : ''}</div>
        <img class="qr" src="${qrUrl}" width="150" height="150" alt="QR-kode">
        <div class="status ${registration.checked_in ? 'checked' : ''}">${registration.checked_in ? 'SJEKKET INN' : 'ARRANGEMENT PRO'}</div>
      </article>`;
    });
  }).join('');

  return `<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Navneskilt – ${escapeHtml(activity.title)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f4f4f5;color:#18181b;font-family:Arial,sans-serif}.toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:center;gap:10px;padding:14px;background:rgba(255,255,255,.96);border-bottom:1px solid #ddd}.toolbar button{border:0;border-radius:10px;padding:12px 18px;background:#18181b;color:#fff;font-weight:700;cursor:pointer}.sheet{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10mm;width:210mm;margin:10mm auto;padding:0}.badge{position:relative;display:flex;min-height:125mm;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;border:1px solid #d4d4d8;border-radius:7mm;background:#fff;padding:9mm;text-align:center;break-inside:avoid;page-break-inside:avoid}.badge:before{content:'';position:absolute;inset:0 0 auto;height:5mm;background:#18181b}.brand{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#71717a}.event{margin-top:4mm;font-size:17px;font-weight:700}.name{margin-top:8mm;font-size:28px;font-weight:800;line-height:1.08}.role{margin-top:2mm;font-size:12px;color:#71717a}.details{margin-top:5mm;font-size:10px;color:#71717a}.qr{margin-top:6mm;width:37mm;height:37mm}.status{margin-top:4mm;border-radius:999px;background:#f4f4f5;padding:2mm 4mm;font-size:9px;font-weight:800;letter-spacing:.08em}.status.checked{background:#dcfce7;color:#166534}@page{size:A4;margin:8mm}@media(max-width:800px){.sheet{grid-template-columns:1fr;width:auto;margin:12px;padding:0}.badge{min-height:150mm}}@media print{body{background:#fff}.toolbar{display:none}.sheet{margin:0;padding:0;gap:8mm}.badge{border-color:#aaa;box-shadow:none}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Skriv ut / lagre PDF</button></div><main class="sheet">${badges || '<p>Ingen bekreftede deltakere.</p>'}</main></body></html>`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST'].includes(req.method || '')) return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey) return res.status(500).json({ error: 'Missing server configuration' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let activityId = '';
  let organizationId = '';
  let registrationId = '';
  let ticketToken = '';

  if (req.method === 'GET') {
    registrationId = String(req.query.registrationId || '').trim();
    ticketToken = String(req.query.ticketToken || '').trim();
    if (!registrationId || !ticketToken) return res.status(400).json({ error: 'Missing badge data' });

    const { data: registration, error } = await supabase
      .from('activity_registrations')
      .select('id,full_name,email,attendees,status,ticket_token,checked_in,organization_id,activity_id')
      .eq('id', registrationId)
      .eq('ticket_token', ticketToken)
      .eq('status', 'confirmed')
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!registration) return res.status(404).json({ error: 'Badge not found' });
    activityId = registration.activity_id;
    organizationId = registration.organization_id;
  } else {
    activityId = String(req.body?.activityId || '').trim();
    organizationId = String(req.body?.organizationId || '').trim();
    registrationId = String(req.body?.registrationId || '').trim();
    if (!activityId || !organizationId) return res.status(400).json({ error: 'Missing activity data' });

    const token = bearerToken(req);
    const { data: authData } = await supabase.auth.getUser(token);
    const userId = authData.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const [{ data: organizationAdmin }, { data: platformAdmin }] = await Promise.all([
      supabase.from('organization_admins').select('id').eq('organization_id', organizationId).eq('user_id', userId).eq('invitation_status', 'accepted').maybeSingle(),
      supabase.from('admins').select('id').eq('auth_user_id', userId).in('role', ['owner', 'super_admin', 'superadmin']).maybeSingle(),
    ]);
    if (!organizationAdmin && !platformAdmin) return res.status(403).json({ error: 'Not authorized' });
  }

  const [{ data: activity, error: activityError }, { data: organization, error: organizationError }] = await Promise.all([
    supabase.from('organization_activities').select('id,title,activity_date,location,organization_id').eq('id', activityId).eq('organization_id', organizationId).maybeSingle(),
    supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
  ]);
  if (activityError || organizationError) return res.status(500).json({ error: activityError?.message || organizationError?.message });
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  let query = supabase
    .from('activity_registrations')
    .select('id,full_name,email,attendees,ticket_token,checked_in')
    .eq('activity_id', activityId)
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .order('full_name', { ascending: true });
  if (registrationId) query = query.eq('id', registrationId);
  if (ticketToken) query = query.eq('ticket_token', ticketToken);

  const { data: registrations, error: registrationsError } = await query;
  if (registrationsError) return res.status(500).json({ error: registrationsError.message });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).send(renderPage({
    organizationName: organization?.name || 'Yasaflow',
    activity,
    registrations: registrations || [],
  }));
}
