import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.ACTIVITY_FROM_EMAIL || process.env.MEMBERSHIP_FROM_EMAIL || 'Yasaflow <noreply@yasaflow.com>';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

const bearerToken = (req: VercelRequest) => {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST'].includes(req.method || '')) return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey) return res.status(500).json({ error: 'Missing server configuration' });

  const registrationId = String(req.method === 'GET' ? req.query.registrationId : req.body?.registrationId || '').trim();
  const ticketToken = String(req.method === 'GET' ? req.query.ticketToken : req.body?.ticketToken || '').trim();
  const force = req.method === 'POST' && req.body?.force === true;
  if (!registrationId || !ticketToken) return res.status(400).json({ error: 'Missing ticket data' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from('activity_registrations')
    .select('id,full_name,email,attendees,status,ticket_token,confirmation_email_sent_at,organization_id,organization_activities!inner(id,title,activity_date,start_time,end_time,location,organization_id,organizations(name))')
    .eq('id', registrationId)
    .eq('ticket_token', ticketToken)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Ticket not found' });

  const activity = data.organization_activities as unknown as {
    id: string; title: string; activity_date: string; start_time: string | null; end_time: string | null;
    location: string | null; organization_id: string; organizations: { name?: string } | null;
  };
  const organizationName = activity.organizations?.name || 'Yasaflow';
  const ticketValue = `yasaflow-ticket:${activity.organization_id}:${activity.id}:${data.ticket_token}`;
  const qrUrl = `https://quickchart.io/qr?size=420&margin=2&text=${encodeURIComponent(ticketValue)}`;
  const date = new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = activity.start_time ? `${activity.start_time.slice(0, 5)}${activity.end_time ? `–${activity.end_time.slice(0, 5)}` : ''}` : '';
  const confirmed = data.status === 'confirmed';
  const baseUrl = `https://${req.headers.host || 'dtim-ramazanberber2801-ops-projects.vercel.app'}`;
  const ticketUrl = `${baseUrl}/api/send-activity-ticket?registrationId=${encodeURIComponent(data.id)}&ticketToken=${encodeURIComponent(data.ticket_token)}`;

  const ticketCard = `<div style="max-width:620px;margin:24px auto;background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:30px;box-sizing:border-box"><p style="font-size:13px;color:#666;margin:0 0 8px">${escapeHtml(organizationName)} · Arrangement Pro</p><h1 style="font-size:28px;margin:0 0 10px">${escapeHtml(activity.title)}</h1><p style="font-size:17px;margin:0 0 22px">${escapeHtml(data.full_name)}</p><div style="background:#f7f7f8;border-radius:14px;padding:16px;margin:18px 0"><p style="margin:5px 0"><strong>Dato:</strong> ${escapeHtml(date)}</p>${time ? `<p style="margin:5px 0"><strong>Tid:</strong> ${escapeHtml(time)}</p>` : ''}${activity.location ? `<p style="margin:5px 0"><strong>Sted:</strong> ${escapeHtml(activity.location)}</p>` : ''}<p style="margin:5px 0"><strong>Antall:</strong> ${data.attendees}</p></div>${confirmed ? `<div style="text-align:center"><img src="${qrUrl}" width="300" height="300" alt="QR-billett" style="max-width:100%;height:auto"><p style="font-size:13px;color:#666">Vis QR-koden ved inngangen. Billetten kan bare sjekkes inn én gang.</p></div>` : '<p style="padding:14px;background:#fff7ed;border-radius:12px;color:#9a3412">Du står på venteliste. QR-billetten aktiveres når plassen er bekreftet.</p>'}<p style="font-size:11px;color:#888;word-break:break-all">Billett-ID: ${escapeHtml(data.id)}</p></div>`;

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(`<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(activity.title)} – billett</title><style>body{margin:0;padding:16px;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020}.actions{max-width:620px;margin:0 auto 12px;display:flex;gap:10px}.actions button{border:0;border-radius:10px;padding:12px 16px;font-weight:700;cursor:pointer}@media print{body{background:#fff;padding:0}.actions{display:none}}</style></head><body><div class="actions"><button onclick="window.print()">Last ned / skriv ut PDF</button></div>${ticketCard}</body></html>`);
  }

  if (!resendKey) return res.status(500).json({ error: 'Missing email configuration' });
  if (force) {
    const token = bearerToken(req);
    const { data: authData } = await supabase.auth.getUser(token);
    const userId = authData.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const [{ data: organizationAdmin }, { data: platformAdmin }] = await Promise.all([
      supabase.from('organization_admins').select('id').eq('organization_id', data.organization_id).eq('user_id', userId).eq('invitation_status', 'accepted').maybeSingle(),
      supabase.from('admins').select('id').eq('auth_user_id', userId).in('role', ['owner', 'super_admin', 'superadmin']).maybeSingle(),
    ]);
    if (!organizationAdmin && !platformAdmin) return res.status(403).json({ error: 'Not authorized' });
  } else if (data.confirmation_email_sent_at) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const html = `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>${escapeHtml(activity.title)}</title></head><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020"><div style="max-width:660px;margin:auto;padding:24px"><p>Hei ${escapeHtml(data.full_name)},</p><p>${confirmed ? 'Påmeldingen din er bekreftet. Din personlige QR-billett ligger nedenfor.' : 'Arrangementet er fullt, og du står på venteliste.'}</p>${ticketCard}<p style="text-align:center"><a href="${ticketUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;font-weight:700">Åpne og last ned billetten</a></p><p style="font-size:13px;color:#777">Vennlig hilsen<br>${escapeHtml(organizationName)}</p></div></body></html>`;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to: [data.email], subject: `${confirmed ? 'Din billett' : 'Venteliste'} – ${activity.title}`, html }),
  });
  const emailResult = await emailResponse.json();
  if (!emailResponse.ok) return res.status(502).json({ error: emailResult?.message || 'Email delivery failed' });

  await supabase.from('activity_registrations').update({ confirmation_email_sent_at: new Date().toISOString() }).eq('id', data.id);
  return res.status(200).json({ ok: true, id: emailResult.id, resent: force, ticketUrl });
}
