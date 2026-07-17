import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
};

type Payload={requestId:string;eventType:'received'|'approved'|'rejected'};
type EmailPayload={job_id:string;recipient_email:string;recipient_name:string;organization_name:string;reply_to_email:string|null;welcome_message:string|null};

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  let jobId='';
  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL');
    const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
    const resendKey=Deno.env.get('RESEND_API_KEY');
    const fromEmail=Deno.env.get('MEMBERSHIP_FROM_EMAIL')||'Yasaflow <noreply@yasaflow.com>';
    if(!supabaseUrl||!anonKey||!resendKey)throw new Error('Missing required environment variables');
    const authorization=req.headers.get('Authorization')||'';
    const client=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
    const body=(await req.json()) as Payload;
    if(!body.requestId||!['received','approved','rejected'].includes(body.eventType))throw new Error('Invalid payload');
    const {data,error}=await client.rpc('prepare_membership_email',{p_request_id:body.requestId,p_event_type:body.eventType});
    if(error)throw error;
    const payload=(data?.[0]||null) as EmailPayload|null;
    if(!payload)return new Response(JSON.stringify({ok:true,skipped:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    jobId=payload.job_id;
    const subjects={received:`Vi har mottatt medlemsforespørselen din – ${payload.organization_name}`,approved:`Medlemskapet ditt er godkjent – ${payload.organization_name}`,rejected:`Oppdatering om medlemsforespørselen din – ${payload.organization_name}`};
    const intros={received:`Hei ${payload.recipient_name},<br><br>Vi har mottatt medlemsforespørselen din. Organisasjonen behandler den og kontakter deg ved behov.`,approved:`Hei ${payload.recipient_name},<br><br>Medlemsforespørselen din er godkjent.`,rejected:`Hei ${payload.recipient_name},<br><br>Medlemsforespørselen din er dessverre avslått.`};
    const welcome=body.eventType==='approved'&&payload.welcome_message?`<p>${payload.welcome_message.replace(/\n/g,'<br>')}</p>`:'';
    const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222"><p>${intros[body.eventType]}</p>${welcome}<p>Vennlig hilsen<br>${payload.organization_name}</p></div>`;
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:fromEmail,to:[payload.recipient_email],reply_to:payload.reply_to_email||undefined,subject:subjects[body.eventType],html})});
    const result=await response.json();
    if(!response.ok)throw new Error(result?.message||'Resend request failed');
    const {error:completeError}=await client.rpc('complete_membership_email',{p_job_id:jobId,p_request_id:body.requestId,p_event_type:body.eventType});
    if(completeError)throw completeError;
    return new Response(JSON.stringify({ok:true,id:result.id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    try{
      if(jobId){
        const supabaseUrl=Deno.env.get('SUPABASE_URL');const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
        if(supabaseUrl&&anonKey){const client=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:req.headers.get('Authorization')||''}}});await client.rpc('fail_membership_email',{p_job_id:jobId,p_error:message});}
      }
    }catch{}
    return new Response(JSON.stringify({ok:false,error:message}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
  }
});
