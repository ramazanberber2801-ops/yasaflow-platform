import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.ACTIVITY_FROM_EMAIL || process.env.MEMBERSHIP_FROM_EMAIL || 'Yasaflow <noreply@yasaflow.com>';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey || !resendKey) return res.status(500).json({ error: 'Missing email configuration' });

  const registrationId = String(req.body?.registrationId || '').trim();
  const ticketToken = String(req.body?.ticketToken || '').trim();
  if (!registrationId || !ticketToken) return res.status(400).json({ error: 'Missing ticket data' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from('activity_registrations')
    .select('id,full_name,email,attendees,status,ticket_token,confirmation_email_sent_at,organization_activities!inner(id,title,activity_date,start_time,end_time,location,organization_id,organizations(name))')
    .eq('id', registrationId)
    .eq('ticket_token', ticketToken)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Ticket not found' });
  if (data.confirmation_email_sent_at) return res.status(200).json({ ok: true, skipped: true });

  const activity = data.organization_activities as unknown as {
    id: string; title: string; activity_date: string; start_time: string | null; end_time: string | null;
    location: string | null; organization_id: string; organizations: { name?: string } | null;
  };
  const organizationName = activity.organizations?.name || 'Yasaflow';
  const ticketValue = `yasaflow-ticket:${activity.organization_id}:${activity.id}:${data.ticket_token}`;
  const qrUrl = `https://quickchart.io/qr?size=320&margin=2&text=${encodeURIComponent(ticketValue)}`;
  const date = new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = activity.start_time ? `${activity.start_time.slice(0, 5)}${activity.end_time ? `–${activity.end_time.slice(0, 5)}` : ''}` : '';
  const confirmed = data.status === 'confirmed';

  const html = `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>${escapeHtml(activity.title)}</title></head><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020"><div style="max-width:620px;margin:auto;padding:24px"><div style="background:#fff;border-radius:18px;padding:28px"><p style="font-size:13px;color:#666;margin:0 0 8px">${escapeHtml(organizationName)}</p><h1 style="font-size:26px;margin:0 0 16px">${escapeHtml(activity.title)}</h1><p>Hei ${escapeHtml(data.full_name)},</p><p>${confirmed ? 'Påmeldingen din er bekreftet.' : 'Arrangementet er fullt, og du står på venteliste.'}</p><div style="background:#f7f7f7;border-radius:14px;padding:16px;margin:20px 0"><p><strong>Dato:</strong> ${escapeHtml(date)}</p>${time ? `<p><strong>Tid:</strong> ${escapeHtml(time)}</p>` : ''}${activity.location ? `<p><strong>Sted:</strong> ${escapeHtml(activity.location)}</p>` : ''}<p><strong>Antall:</strong> ${data.attendees}</p></div>${confirmed ? `<div style="text-align:center"><img src="${qrUrl}" width="260" height="260" alt="QR-billett" style="max-width:100%;height:auto"><p style="font-size:13px;color:#666">Vis QR-koden ved inngangen. Billetten kan bare sjekkes inn én gang.</p></div>` : ''}<p style="font-size:13px;color:#777">Vennlig hilsen<br>${escapeHtml(organizationName)}</p></div></div></body></html>`;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to: [data.email], subject: `${confirmed ? 'Din billett' : 'Venteliste'} – ${activity.title}`, html }),
  });
  const emailResult = await emailResponse.json();
  if (!emailResponse.ok) return res.status(502).json({ error: emailResult?.message || 'Email delivery failed' });

  await supabase.from('activity_registrations').update({ confirmation_email_sent_at: new Date().toISOString() }).eq('id', data.id);
  return res.status(200).json({ ok: true, id: emailResult.id });
}
