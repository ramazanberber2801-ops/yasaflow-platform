import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl=process.env.VITE_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const esc=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const page=(title:string,body:string)=>`<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;padding:18px}.card{max-width:620px;margin:40px auto;background:#fff;border:1px solid #e4e4e7;border-radius:24px;padding:28px}.eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#71717a}.title{font-size:28px;margin:8px 0 18px}.grid{display:grid;gap:16px}label{font-size:13px;font-weight:700}select,textarea,input{width:100%;margin-top:7px;border:1px solid #d4d4d8;border-radius:12px;padding:12px;font:inherit}button{border:0;border-radius:12px;padding:14px;font-weight:700;background:#18181b;color:#fff;cursor:pointer}.ok{padding:18px;border-radius:16px;background:#ecfdf5;color:#166534}</style></head><body><main class="card">${body}</main></body></html>`;

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(!supabaseUrl||!serviceRoleKey)return res.status(500).send('Missing server configuration');
  const token=String((req.method==='POST'?req.body?.token:req.query.token)||'').trim();
  if(!/^[0-9a-f-]{36}$/i.test(token))return res.status(400).send('Ugyldig evalueringslenke');
  const supabase=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await supabase.from('activity_evaluations').select('id,rating,nps,comment,submitted_at,activity:organization_activities(title,activity_date,organization:organizations(name))').eq('response_token',token).maybeSingle();
  if(error)return res.status(500).send('Evalueringen kunne ikke leses');
  if(!data)return res.status(404).send('Evalueringen finnes ikke');
  const activity=data.activity as unknown as {title:string;activity_date:string;organization?:{name?:string}|null};
  if(req.method==='POST'){
    if(data.submitted_at)return res.status(200).send(page('Takk',`<div class="ok"><strong>Takk!</strong><p>Evalueringen er allerede registrert.</p></div>`));
    const rating=Number(req.body?.rating);const nps=Number(req.body?.nps);const comment=String(req.body?.comment||'').trim().slice(0,4000);
    if(!Number.isInteger(rating)||rating<1||rating>5||!Number.isInteger(nps)||nps<0||nps>10)return res.status(400).send('Ugyldig vurdering');
    const {error:updateError}=await supabase.from('activity_evaluations').update({rating,nps,comment:comment||null,submitted_at:new Date().toISOString()}).eq('response_token',token).is('submitted_at',null);
    if(updateError)return res.status(500).send('Evalueringen kunne ikke lagres');
    return res.status(200).send(page('Takk for tilbakemeldingen',`<div class="ok"><strong>Takk for tilbakemeldingen!</strong><p>Svaret ditt er registrert.</p></div>`));
  }
  if(req.method!=='GET')return res.status(405).send('Method not allowed');
  if(data.submitted_at)return res.status(200).send(page('Takk',`<div class="ok"><strong>Takk!</strong><p>Evalueringen er allerede sendt inn.</p></div>`));
  const org=activity.organization?.name||'Yasaflow';
  return res.status(200).send(page('Evaluering',`<div class="eyebrow">${esc(org)} · Arrangement Pro</div><h1 class="title">Hvordan var ${esc(activity.title)}?</h1><form method="post" class="grid"><input type="hidden" name="token" value="${esc(token)}"><label>Helhetsvurdering<select name="rating" required><option value="">Velg</option><option value="5">5 – Svært bra</option><option value="4">4 – Bra</option><option value="3">3 – Greit</option><option value="2">2 – Mindre bra</option><option value="1">1 – Dårlig</option></select></label><label>Hvor sannsynlig er det at du anbefaler arrangementet? (0–10)<input name="nps" type="number" min="0" max="10" required></label><label>Kommentar<textarea name="comment" rows="5" placeholder="Hva fungerte bra, og hva kan forbedres?"></textarea></label><button type="submit">Send evaluering</button></form>`));
}
