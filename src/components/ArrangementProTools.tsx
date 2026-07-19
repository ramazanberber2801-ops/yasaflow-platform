import { useEffect, useMemo, useState } from 'react';
import { Award, BarChart3, CalendarRange, CreditCard, Download, Loader2, MessageSquareText, RefreshCw, Star, WalletCards } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Activity={id:string;title:string;activity_date:string};
type Registration={registration_id:string;full_name:string;email:string;attendees:number;status:string;checked_in:boolean;payment_confirmed:boolean;certificate_token:string|null;wallet_token:string|null;certificate_issued_at:string|null};
type Frequency='daily'|'weekly'|'monthly';
type ReportSummary={confirmed_registrations:number;registered_attendees:number;waitlist_attendees:number;paid_registrations:number;checked_in_registrations:number;average_rating:number|null;average_nps:number|null;evaluation_responses:number};
type Evaluation={id:string;rating:number|null;nps:number|null;comment:string|null;submitted_at:string|null;registration?:{full_name?:string|null;email?:string|null}|null};

const csvCell=(value:unknown)=>`"${String(value??'').replace(/"/g,'""')}"`;
const saveCsv=(rows:unknown[][],filename:string)=>{const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);};
const numberValue=(value:unknown)=>value===null||value===undefined?0:Number(value)||0;

export function ArrangementProTools({activity,organizationId}:{activity:Activity;organizationId:string}){
  const [registrations,setRegistrations]=useState<Registration[]>([]);
  const [summary,setSummary]=useState<ReportSummary|null>(null);
  const [evaluations,setEvaluations]=useState<Evaluation[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [frequency,setFrequency]=useState<Frequency>('weekly');
  const [interval,setIntervalValue]=useState('1');
  const [occurrences,setOccurrences]=useState('4');

  const load=async()=>{if(!supabase)return;setLoading(true);const [registrationsResult,summaryResult,evaluationsResult]=await Promise.all([
    supabase.rpc('get_activity_registration_overview',{p_activity_id:activity.id}),
    supabase.from('activity_report_summary').select('confirmed_registrations,registered_attendees,waitlist_attendees,paid_registrations,checked_in_registrations,average_rating,average_nps,evaluation_responses').eq('activity_id',activity.id).maybeSingle(),
    supabase.from('activity_evaluations').select('id,rating,nps,comment,submitted_at,registration:activity_registrations(full_name,email)').eq('activity_id',activity.id).not('submitted_at','is',null).order('submitted_at',{ascending:false})
  ]);
  if(registrationsResult.error)setMessage(registrationsResult.error.message);else setRegistrations((registrationsResult.data||[]) as Registration[]);
  if(!summaryResult.error&&summaryResult.data){const row=summaryResult.data as Record<string,unknown>;setSummary({confirmed_registrations:numberValue(row.confirmed_registrations),registered_attendees:numberValue(row.registered_attendees),waitlist_attendees:numberValue(row.waitlist_attendees),paid_registrations:numberValue(row.paid_registrations),checked_in_registrations:numberValue(row.checked_in_registrations),average_rating:row.average_rating===null?null:Number(row.average_rating),average_nps:row.average_nps===null?null:Number(row.average_nps),evaluation_responses:numberValue(row.evaluation_responses)});}else setSummary(null);
  if(!evaluationsResult.error)setEvaluations((evaluationsResult.data||[]) as unknown as Evaluation[]);
  setLoading(false);};
  useEffect(()=>{void load();},[activity.id]);

  const confirmed=useMemo(()=>registrations.filter(row=>row.status==='confirmed'),[registrations]);
  const registeredAttendees=confirmed.reduce((sum,row)=>sum+row.attendees,0);
  const paidPlaces=confirmed.filter(row=>row.payment_confirmed).reduce((sum,row)=>sum+row.attendees,0);
  const attended=confirmed.filter(row=>row.checked_in).length;
  const waitlistPlaces=registrations.filter(row=>row.status==='waitlist').reduce((sum,row)=>sum+row.attendees,0);
  const submitted=evaluations.filter(row=>row.submitted_at);
  const averageRating=submitted.length?submitted.reduce((sum,row)=>sum+numberValue(row.rating),0)/submitted.length:null;
  const averageNps=submitted.length?submitted.reduce((sum,row)=>sum+numberValue(row.nps),0)/submitted.length:null;
  const npsScore=submitted.length?Math.round(((submitted.filter(row=>numberValue(row.nps)>=9).length-submitted.filter(row=>numberValue(row.nps)<=6).length)/submitted.length)*100):null;
  const responseRate=attended?Math.round((submitted.length/attended)*100):0;
  const stats={confirmed:summary?.confirmed_registrations??confirmed.length,attendees:summary?.registered_attendees??registeredAttendees,waitlist:summary?.waitlist_attendees??waitlistPlaces,paid:summary?.paid_registrations??confirmed.filter(row=>row.payment_confirmed).length,checkedIn:summary?.checked_in_registrations??attended,rating:summary?.average_rating??averageRating,npsAverage:summary?.average_nps??averageNps,responses:summary?.evaluation_responses??submitted.length};

  const togglePayment=async(row:Registration)=>{if(!supabase)return;setBusy(`payment-${row.registration_id}`);setMessage('');const {error}=await supabase.rpc('set_activity_registration_payment',{p_registration_id:row.registration_id,p_confirmed:!row.payment_confirmed});if(error)setMessage(error.message);else{setMessage(`${row.full_name}: betaling ${row.payment_confirmed?'fjernet':'bekreftet'}.`);await load();}setBusy('');};
  const issueCertificate=async(row:Registration)=>{if(!supabase)return;setBusy(`certificate-${row.registration_id}`);setMessage('');try{const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Du må være innlogget for å sende kursbevis.');const response=await fetch('/api/send-activity-certificate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({registrationId:row.registration_id,organizationId})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error||'Kursbeviset kunne ikke sendes.');setMessage(`Kursbevis ble sendt til ${row.email}.`);if(payload.certificateUrl)window.open(payload.certificateUrl,'_blank','noopener,noreferrer');await load();}catch(error){setMessage(error instanceof Error?error.message:String(error));}finally{setBusy('');}};
  const openWallet=(row:Registration)=>{if(row.wallet_token)window.open(`/api/activity-wallet?token=${encodeURIComponent(row.wallet_token)}`,'_blank','noopener,noreferrer');};
  const sendEvaluations=async()=>{if(!supabase)return;if(!window.confirm('Opprette og sende evalueringslenker til alle fremmøtte deltakere?'))return;setBusy('evaluations');setMessage('');try{const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Du må være innlogget for å sende evalueringer.');const response=await fetch('/api/send-activity-evaluations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({activityId:activity.id,organizationId})});const payload=await response.json().catch(()=>({}));if(!response.ok&&response.status!==207)throw new Error(payload?.error||'Evalueringene kunne ikke sendes.');setMessage(payload.failed?`${payload.sent} evaluering(er) sendt, ${payload.failed} mislyktes.`:`${payload.sent} evalueringslenke(r) ble sendt.`);await load();}catch(error){setMessage(error instanceof Error?error.message:String(error));}finally{setBusy('');}};
  const createSeries=async()=>{if(!supabase)return;const every=Number(interval);const count=Number(occurrences);if(!Number.isInteger(every)||every<1||!Number.isInteger(count)||count<2||count>104){setMessage('Intervall må være minst 1 og antall må være mellom 2 og 104.');return;}if(!window.confirm(`Opprette ${count} forekomster av ${activity.title}?`))return;setBusy('recurrence');setMessage('');const {data,error}=await supabase.rpc('create_recurring_activity_instances',{p_activity_id:activity.id,p_frequency:frequency,p_interval:every,p_occurrences:count});if(error)setMessage(error.message);else setMessage(`${Number(data||count)} forekomster ble opprettet.`);setBusy('');};
  const exportReport=()=>saveCsv([
    ['ARRANGEMENTSRAPPORT'],['Arrangement',activity.title],['Dato',activity.activity_date],[],
    ['NØKKELTALL'],['Bekreftede registreringer',stats.confirmed],['Registrerte deltakere',stats.attendees],['Ventelisteplasser',stats.waitlist],['Betalte registreringer',stats.paid],['Sjekket inn',stats.checkedIn],['Evalueringssvar',stats.responses],['Svarprosent',`${responseRate}%`],['Gjennomsnittlig vurdering',stats.rating?.toFixed(2)||'–'],['Gjennomsnittlig NPS-score',stats.npsAverage?.toFixed(2)||'–'],['NPS',npsScore??'–'],[],
    ['DELTAKERE'],['Navn','E-post','Antall','Status','Betalt','Sjekket inn','Kursbevis'],...registrations.map(row=>[row.full_name,row.email,row.attendees,row.status,row.payment_confirmed?'Ja':'Nei',row.checked_in?'Ja':'Nei',row.certificate_issued_at?'Utstedt':'Ikke utstedt']),[],
    ['EVALUERINGER'],['Navn','E-post','Vurdering','NPS','Kommentar','Besvart'],...submitted.map(row=>[row.registration?.full_name||'',row.registration?.email||'',row.rating??'',row.nps??'',row.comment||'',row.submitted_at?new Date(row.submitted_at).toLocaleString('nb-NO'):''])
  ],`arrangement-rapport-${activity.title.toLowerCase().replace(/[^a-z0-9æøå]+/gi,'-')}.csv`);

  return <section className="mt-5 rounded-2xl border p-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest opacity-45">Arrangement Pro</p><h4 className="font-semibold">Rapport og administrasjon</h4></div><button type="button" onClick={()=>void load()} className="rounded-lg border p-2" aria-label="Oppdater rapport"><RefreshCw size={15}/></button></div>
    {message&&<p className="mt-3 rounded-xl bg-black/[0.04] p-3 text-xs">{message}</p>}
    <div className="mt-4 rounded-2xl border p-3">
      <div className="flex items-center gap-2"><BarChart3 size={16}/><p className="text-sm font-semibold">Resultatoversikt</p></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[['Påmeldte',stats.attendees],['Venteliste',stats.waitlist],['Betalt',paidPlaces],['Sjekket inn',stats.checkedIn],['Kursbevis',registrations.filter(r=>r.certificate_issued_at).length],['Svar',stats.responses]].map(([label,value])=><div key={String(label)} className="rounded-xl bg-black/[0.03] p-3 text-center"><p className="text-lg font-semibold">{value}</p><p className="text-[10px] opacity-50">{label}</p></div>)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border p-3"><p className="text-[10px] uppercase opacity-45">Vurdering</p><p className="mt-1 flex items-center gap-1 text-lg font-semibold"><Star size={16}/>{stats.rating?.toFixed(1)??'–'}<span className="text-xs font-normal opacity-45">/ 5</span></p></div>
        <div className="rounded-xl border p-3"><p className="text-[10px] uppercase opacity-45">NPS</p><p className="mt-1 text-lg font-semibold">{npsScore??'–'}</p></div>
        <div className="rounded-xl border p-3"><p className="text-[10px] uppercase opacity-45">Svarprosent</p><p className="mt-1 text-lg font-semibold">{responseRate}%</p></div>
        <div className="rounded-xl border p-3"><p className="text-[10px] uppercase opacity-45">Snitt NPS-svar</p><p className="mt-1 text-lg font-semibold">{stats.npsAverage?.toFixed(1)??'–'}<span className="text-xs font-normal opacity-45"> / 10</span></p></div>
      </div>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <button type="button" onClick={exportReport} className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold"><Download size={15}/>Last ned komplett rapport</button>
      <button type="button" disabled={busy==='evaluations'||attended===0} onClick={()=>void sendEvaluations()} className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold disabled:opacity-50">{busy==='evaluations'?<Loader2 size={15} className="animate-spin"/>:<MessageSquareText size={15}/>}Send evalueringer</button>
    </div>
    <div className="mt-4 rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><MessageSquareText size={16}/><p className="text-sm font-semibold">Tilbakemeldinger</p></div><span className="text-xs opacity-45">{submitted.length} svar</span></div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{submitted.filter(row=>row.comment).map(row=><article key={row.id} className="rounded-xl bg-black/[0.03] p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">{row.registration?.full_name||'Anonym deltaker'}</p><p className="text-[10px] opacity-50">{row.rating??'–'}/5 · NPS {row.nps??'–'}</p></div><p className="mt-2 text-xs leading-relaxed opacity-75">{row.comment}</p></article>)}{!loading&&!submitted.some(row=>row.comment)&&<p className="rounded-xl bg-black/[0.03] p-4 text-center text-xs opacity-55">Ingen skriftlige tilbakemeldinger ennå.</p>}</div>
    </div>
    <div className="mt-4 rounded-2xl border p-3">
      <div className="flex items-center gap-2"><CalendarRange size={16}/><p className="text-sm font-semibold">Gjentakende arrangement</p></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3"><select value={frequency} onChange={e=>setFrequency(e.target.value as Frequency)} className="rounded-xl border p-3 text-xs"><option value="daily">Daglig</option><option value="weekly">Ukentlig</option><option value="monthly">Månedlig</option></select><input aria-label="Intervall" type="number" min="1" value={interval} onChange={e=>setIntervalValue(e.target.value)} className="rounded-xl border p-3 text-xs" placeholder="Intervall"/><input aria-label="Antall forekomster" type="number" min="2" max="104" value={occurrences} onChange={e=>setOccurrences(e.target.value)} className="rounded-xl border p-3 text-xs" placeholder="Antall"/></div>
      <button type="button" disabled={busy==='recurrence'} onClick={()=>void createSeries()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{busy==='recurrence'?<Loader2 size={15} className="animate-spin"/>:<CalendarRange size={15}/>}Opprett serie</button>
    </div>
    <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">
      {loading?<div className="flex justify-center p-6"><Loader2 className="animate-spin"/></div>:registrations.map(row=><article key={row.registration_id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{row.full_name}</p><p className="text-xs opacity-55">{row.email} · {row.attendees} deltaker(e)</p></div><span className="rounded-full bg-black/5 px-2 py-1 text-[10px]">{row.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"><button type="button" disabled={busy===`payment-${row.registration_id}`||row.status!=='confirmed'} onClick={()=>void togglePayment(row)} className="flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] disabled:opacity-40">{busy===`payment-${row.registration_id}`?<Loader2 size={13} className="animate-spin"/>:<CreditCard size={13}/>} {row.payment_confirmed?'Fjern betalt':'Marker betalt'}</button><button type="button" disabled={!row.wallet_token||row.status!=='confirmed'} onClick={()=>openWallet(row)} className="flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] disabled:opacity-40"><WalletCards size={13}/>Wallet</button><button type="button" disabled={!row.checked_in||row.status!=='confirmed'||busy===`certificate-${row.registration_id}`} onClick={()=>void issueCertificate(row)} className="col-span-2 flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] disabled:opacity-40 sm:col-span-1">{busy===`certificate-${row.registration_id}`?<Loader2 size={13} className="animate-spin"/>:<Award size={13}/>} {row.certificate_issued_at?'Send på nytt':'Utsted og send'}</button></div></article>)}
      {!loading&&!registrations.length&&<p className="rounded-xl bg-black/[0.03] p-5 text-center text-sm opacity-55">Ingen påmeldinger ennå.</p>}
    </div>
  </section>;
}
