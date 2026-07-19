import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { applyHtmlSecurityHeaders } from './security-headers';

const supabaseUrl=process.env.VITE_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const esc=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

export default async function handler(req:VercelRequest,res:VercelResponse){
  applyHtmlSecurityHeaders(res);
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).send('Method not allowed');
  }
  if(!supabaseUrl||!serviceRoleKey)return res.status(500).send('Missing server configuration');
  const token=String(req.query.token||'').trim();
  if(!uuid.test(token))return res.status(400).send('Ugyldig billett');
  const supabase=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await supabase.from('activity_registrations')
    .select('id,full_name,status,ticket_token,wallet_token,activity:organization_activities(id,title,activity_date,start_time,end_time,location,status,organization_id,organization:organizations(name,logo_url))')
    .eq('wallet_token',token).maybeSingle();
  if(error)return res.status(500).send('Billetten kunne ikke leses');
  if(!data||data.status!=='confirmed')return res.status(404).send('Billetten finnes ikke eller er ikke aktiv');
  const activity=data.activity as unknown as {id:string;title:string;activity_date:string;start_time?:string|null;end_time?:string|null;location?:string|null;status:string;organization_id:string;organization?:{name?:string;logo_url?:string|null}|null};
  if(activity.status==='cancelled')return res.status(410).send('Arrangementet er avlyst');
  const org=activity.organization?.name||'Yasaflow';
  const qrText=`yasaflow-ticket:${activity.organization_id}:${activity.id}:${data.ticket_token}`;
  const qr=`https://quickchart.io/qr?size=300&margin=1&text=${encodeURIComponent(qrText)}`;
  const date=new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const time=[activity.start_time?.slice(0,5),activity.end_time?.slice(0,5)].filter(Boolean).join('–');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.status(200).send(`<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111827"><title>${esc(activity.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#111827;font-family:Arial,sans-serif;color:#111827;min-height:100vh;display:grid;place-items:center;padding:18px}.pass{width:min(430px,100%);background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 24px 70px #0008}.head{padding:26px;background:linear-gradient(135deg,#111827,#374151);color:#fff}.org{font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.75}.title{font-size:25px;margin:9px 0 0}.body{padding:24px}.name{font-size:22px;font-weight:700}.meta{margin:16px 0;color:#4b5563;line-height:1.65}.qr{display:grid;place-items:center;border-top:1px dashed #cbd5e1;padding-top:22px}.qr img{width:210px;height:210px}.hint{text-align:center;color:#6b7280;font-size:12px;margin-top:8px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.btn{border:0;border-radius:14px;padding:13px;font-weight:700;text-decoration:none;text-align:center;cursor:pointer}.primary{background:#111827;color:#fff}.secondary{background:#f3f4f6;color:#111827}@media print{body{background:#fff;padding:0}.pass{box-shadow:none}.actions{display:none}}</style></head><body><main class="pass"><header class="head"><div class="org">${esc(org)} · Arrangement Pro</div><h1 class="title">${esc(activity.title)}</h1></header><section class="body"><div class="name">${esc(data.full_name)}</div><div class="meta"><strong>${esc(date)}</strong>${time?`<br>${esc(time)}`:''}${activity.location?`<br>${esc(activity.location)}`:''}</div><div class="qr"><img src="${qr}" alt="QR-billett"><div class="hint">Vis QR-koden ved innsjekking</div></div><div class="actions"><button class="btn secondary" onclick="window.print()">Lagre billett</button><a class="btn primary" href="${qr}" download="qr-billett.png" rel="noreferrer">Last ned QR</a></div></section></main></body></html>`);
}
