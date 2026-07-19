import { useEffect, useMemo, useState } from 'react';
import { Award, CalendarRange, CreditCard, Download, Loader2, MessageSquareText, RefreshCw, WalletCards } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Activity={id:string;title:string;activity_date:string};
type Registration={registration_id:string;full_name:string;email:string;attendees:number;status:string;checked_in:boolean;payment_confirmed:boolean;certificate_token:string|null;wallet_token:string|null;certificate_issued_at:string|null};
type Frequency='daily'|'weekly'|'monthly';

const csvCell=(value:unknown)=>`"${String(value??'').replace(/"/g,'""')}"`;
const saveCsv=(rows:unknown[][],filename:string)=>{const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);};

export function ArrangementProTools({activity,organizationId}:{activity:Activity;organizationId:string}){
  const [registrations,setRegistrations]=useState<Registration[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [frequency,setFrequency]=useState<Frequency>('weekly');
  const [interval,setIntervalValue]=useState('1');
  const [occurrences,setOccurrences]=useState('4');

  const load=async()=>{if(!supabase)return;setLoading(true);const {data,error}=await supabase.rpc('get_activity_registration_overview',{p_activity_id:activity.id});if(error)setMessage(error.message);else setRegistrations((data||[]) as Registration[]);setLoading(false);};
  useEffect(()=>{void load();},[activity.id]);

  const confirmed=useMemo(()=>registrations.filter(row=>row.status==='confirmed'),[registrations]);
  const revenueCount=confirmed.filter(row=>row.payment_confirmed).reduce((sum,row)=>sum+row.attendees,0);
  const attended=confirmed.filter(row=>row.checked_in).length;

  const togglePayment=async(row:Registration)=>{if(!supabase)return;setBusy(`payment-${row.registration_id}`);setMessage('');const {error}=await supabase.rpc('set_activity_registration_payment',{p_registration_id:row.registration_id,p_confirmed:!row.payment_confirmed});if(error)setMessage(error.message);else{setMessage(`${row.full_name}: betaling ${row.payment_confirmed?'fjernet':'bekreftet'}.`);await load();}setBusy('');};
  const issueCertificate=async(row:Registration)=>{if(!supabase)return;setBusy(`certificate-${row.registration_id}`);setMessage('');try{const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Du må være innlogget for å sende kursbevis.');const response=await fetch('/api/send-activity-certificate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({registrationId:row.registration_id,organizationId})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error||'Kursbeviset kunne ikke sendes.');setMessage(`Kursbevis ble sendt til ${row.email}.`);if(payload.certificateUrl)window.open(payload.certificateUrl,'_blank','noopener,noreferrer');await load();}catch(error){setMessage(error instanceof Error?error.message:String(error));}finally{setBusy('');}};
  const openWallet=(row:Registration)=>{if(row.wallet_token)window.open(`/api/activity-wallet?token=${encodeURIComponent(row.wallet_token)}`,'_blank','noopener,noreferrer');};
  const sendEvaluations=async()=>{if(!supabase)return;if(!window.confirm('Opprette og sende evalueringslenker til alle fremmøtte deltakere?'))return;setBusy('evaluations');setMessage('');try{const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Du må være innlogget for å sende evalueringer.');const response=await fetch('/api/send-activity-evaluations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({activityId:activity.id,organizationId})});const payload=await response.json().catch(()=>({}));if(!response.ok&&response.status!==207)throw new Error(payload?.error||'Evalueringene kunne ikke sendes.');setMessage(payload.failed?`${payload.sent} evaluering(er) sendt, ${payload.failed} mislyktes.`:`${payload.sent} evalueringslenke(r) ble sendt.`);}catch(error){setMessage(error instanceof Error?error.message:String(error));}finally{setBusy('');}};
  const createSeries=async()=>{if(!supabase)return;const every=Number(interval);const count=Number(occurrences);if(!Number.isInteger(every)||every<1||!Number.isInteger(count)||count<2||count>104){setMessage('Intervall må være minst 1 og antall må være mellom 2 og 104.');return;}if(!window.confirm(`Opprette ${count} forekomster av ${activity.title}?`))return;setBusy('recurrence');setMessage('');const {data,error}=await supabase.rpc('create_recurring_activity_instances',{p_activity_id:activity.id,p_frequency:frequency,p_interval:every,p_occurrences:count});if(error)setMessage(error.message);else setMessage(`${Number(data||count)} forekomster ble opprettet.`);setBusy('');};
  const exportReport=()=>saveCsv([
    ['Arrangement',activity.title],['Dato',activity.activity_date],[],
    ['Navn','E-post','Antall','Status','Betalt','Sjekket inn','Kursbevis'],
    ...registrations.map(row=>[row.full_name,row.email,row.attendees,row.status,row.payment_confirmed?'Ja':'Nei',row.checked_in?'Ja':'Nei',row.certificate_issued_at?'Utstedt':'Ikke utstedt'])
  ],`arrangement-rapport-${activity.title.toLowerCase().replace(/[^a-z0-9æøå]+/gi,'-')}.csv`);

  return <section className="mt-5 rounded-2xl border p-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest opacity-45">Arrangement Pro</p><h4 className="font-semibold">Verktøy og administrasjon</h4></div><button type="button" onClick={()=>void load()} className="rounded-lg border p-2" aria-label="Oppdater"><RefreshCw size={15}/></button></div>
    {message&&<p className="mt-3 rounded-xl bg-black/[0.04] p-3 text-xs">{message}</p>}
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-xl bg-black/[0.03] p-3 text-center"><p className="text-lg font-semibold">{confirmed.length}</p><p className="text-[10px] opacity-50">Bekreftede</p></div>
      <div className="rounded-xl bg-black/[0.03] p-3 text-center"><p className="text-lg font-semibold">{revenueCount}</p><p className="text-[10px] opacity-50">Betalte plasser</p></div>
      <div className="rounded-xl bg-black/[0.03] p-3 text-center"><p className="text-lg font-semibold">{attended}</p><p className="text-[10px] opacity-50">Sjekket inn</p></div>
      <div className="rounded-xl bg-black/[0.03] p-3 text-center"><p className="text-lg font-semibold">{registrations.filter(r=>r.certificate_issued_at).length}</p><p className="text-[10px] opacity-50">Kursbevis</p></div>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <button type="button" onClick={exportReport} className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold"><Download size={15}/>Last ned rapport</button>
      <button type="button" disabled={busy==='evaluations'||attended===0} onClick={()=>void sendEvaluations()} className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold disabled:opacity-50">{busy==='evaluations'?<Loader2 size={15} className="animate-spin"/>:<MessageSquareText size={15}/>}Send evalueringer</button>
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
