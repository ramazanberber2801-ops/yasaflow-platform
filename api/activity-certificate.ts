import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl=process.env.VITE_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl=(process.env.PUBLIC_APP_URL||process.env.VITE_PUBLIC_APP_URL||'https://app.yasaflow.com').replace(/\/$/,'');
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='GET')return res.status(405).send('Method not allowed');
  if(!supabaseUrl||!serviceRoleKey)return res.status(500).send('Missing server configuration');
  const token=String(req.query.token||'').trim();
  if(!/^[0-9a-f-]{36}$/i.test(token))return res.status(400).send('Ugyldig kursbevis');
  const supabase=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await supabase.from('activity_registrations')
    .select('id,full_name,certificate_issued_at,certificate_token,status,checked_in,activity:organization_activities(id,title,activity_date,location,certificate_title,certificate_signature_name,organization:organizations(name,logo_url))')
    .eq('certificate_token',token).maybeSingle();
  if(error)return res.status(500).send('Kursbeviset kunne ikke leses');
  if(!data||!data.certificate_issued_at||data.status!=='confirmed'||!data.checked_in)return res.status(404).send('Kursbeviset finnes ikke eller er ikke gyldig');
  const activity=data.activity as unknown as {id:string;title:string;activity_date:string;location?:string|null;certificate_title?:string|null;certificate_signature_name?:string|null;organization?:{name?:string;logo_url?:string|null}|null};
  const organization=activity.organization?.name||'Yasaflow';
  const verifyUrl=`${appUrl}/api/activity-certificate?token=${encodeURIComponent(token)}`;
  const qr=`https://quickchart.io/qr?size=220&margin=1&text=${encodeURIComponent(verifyUrl)}`;
  const date=new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'});
  const certificateNumber=`YF-${activity.activity_date.replaceAll('-','')}-${data.id.slice(0,8).toUpperCase()}`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=300');
  return res.status(200).send(`<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kursbevis – ${escapeHtml(data.full_name)}</title><style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#ece9e2;font-family:Georgia,serif;color:#222}.page{width:297mm;min-height:210mm;margin:auto;background:#fff;padding:16mm}.frame{min-height:178mm;border:2px solid #222;padding:8mm;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;position:relative}.eyebrow{font:600 12px Arial,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#666}.title{font-size:42px;margin:14px 0 28px}.name{font-size:34px;border-bottom:1px solid #777;padding:0 26px 8px}.text{font:18px/1.6 Arial,sans-serif;max-width:760px;margin:24px}.course{font-size:28px;margin:0 0 18px}.meta{font:15px Arial,sans-serif;color:#555}.bottom{width:100%;margin-top:34px;display:grid;grid-template-columns:1fr 180px 1fr;align-items:end;gap:20px}.signature{font:15px Arial,sans-serif;border-top:1px solid #555;padding-top:8px}.qr img{width:120px;height:120px}.qr p{font:10px Arial,sans-serif;color:#666;margin:4px}.number{position:absolute;right:8mm;bottom:6mm;font:10px Arial,sans-serif;color:#777}.print{position:fixed;right:18px;top:18px;border:0;border-radius:999px;padding:12px 18px;font-weight:700;cursor:pointer}@media print{body{background:#fff}.print{display:none}.page{margin:0}}</style></head><body><button class="print" onclick="window.print()">Lagre som PDF</button><main class="page"><section class="frame"><div class="eyebrow">${escapeHtml(organization)}</div><h1 class="title">${escapeHtml(activity.certificate_title||'Kursbevis')}</h1><div class="name">${escapeHtml(data.full_name)}</div><p class="text">har deltatt på og fullført</p><h2 class="course">${escapeHtml(activity.title)}</h2><p class="meta">${escapeHtml(date)}${activity.location?` · ${escapeHtml(activity.location)}`:''}</p><div class="bottom"><div class="signature">${escapeHtml(activity.certificate_signature_name||organization)}<br>Arrangør</div><div class="qr"><img src="${qr}" alt="QR-verifisering"><p>Skann for å verifisere</p></div><div class="signature">Utstedt ${escapeHtml(new Date(data.certificate_issued_at).toLocaleDateString('nb-NO'))}<br>Digitalt verifisert</div></div><div class="number">${certificateNumber}</div></section></main></body></html>`);
}
