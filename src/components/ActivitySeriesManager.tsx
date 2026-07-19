import { useEffect, useState } from 'react';
import { CalendarRange, Loader2, Pencil, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ActivityWaitlistManager } from './ActivityWaitlistManager';

type Scope='single'|'following'|'series';
type Action='update'|'cancel'|'reopen';
type SeriesItem={id:string;title:string;activity_date:string;start_time:string|null;end_time:string|null;location:string|null;capacity:number|null;status:string;cancellation_reason:string|null;recurrence_sequence:number|null;confirmed_registrations:number;registered_attendees:number};
type Form={title:string;activityDate:string;startTime:string;endTime:string;location:string;capacity:string;cancellationReason:string};
const emptyForm:Form={title:'',activityDate:'',startTime:'',endTime:'',location:'',capacity:'',cancellationReason:''};

const statusLabel=(item:SeriesItem)=>item.status==='cancelled'?'Avlyst':new Date(`${item.activity_date}T23:59:59`)<new Date()?'Gjennomført':item.capacity&&item.registered_attendees>=item.capacity?'Fullbooket':'Planlagt';

export function ActivitySeriesManager({activityId,organizationId}:{activityId:string;organizationId:string}){
  const [items,setItems]=useState<SeriesItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [selected,setSelected]=useState<SeriesItem|null>(null);
  const [scope,setScope]=useState<Scope>('single');
  const [action,setAction]=useState<Action>('update');
  const [form,setForm]=useState<Form>(emptyForm);

  const load=async()=>{
    if(!supabase)return;
    setLoading(true);
    const {data,error}=await supabase.rpc('get_activity_series',{p_activity_id:activityId});
    if(error)setMessage(error.message);else setItems((data||[]) as SeriesItem[]);
    setLoading(false);
  };

  useEffect(()=>{void load();},[activityId]);

  const open=(item:SeriesItem,nextAction:Action)=>{
    setSelected(item);setAction(nextAction);setScope('single');
    setForm({title:item.title,activityDate:item.activity_date,startTime:item.start_time?.slice(0,5)||'',endTime:item.end_time?.slice(0,5)||'',location:item.location||'',capacity:item.capacity?String(item.capacity):'',cancellationReason:item.cancellation_reason||''});
  };

  const close=()=>{setSelected(null);setForm(emptyForm);};

  const submit=async()=>{
    if(!supabase||!selected)return;
    const scopeText=scope==='single'?'denne forekomsten':scope==='following'?'denne og alle kommende':'hele serien';
    const actionText=action==='cancel'?'avlyse':action==='reopen'?'gjenåpne':'oppdatere';
    if(!window.confirm(`Vil du ${actionText} ${scopeText}? Påmeldte deltakere blir varslet på e-post.`))return;
    setBusy(true);setMessage('');
    try{
      const {data}=await supabase.auth.getSession();
      const token=data.session?.access_token;
      if(!token)throw new Error('Du må være innlogget.');
      const response=await fetch('/api/manage-activity-series',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({activityId:selected.id,organizationId,scope,action,title:form.title,activityDate:form.activityDate,startTime:form.startTime||null,endTime:form.endTime||null,location:form.location,capacity:form.capacity||null,cancellationReason:form.cancellationReason})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok&&response.status!==207)throw new Error(payload.error||'Endringen kunne ikke lagres.');
      setMessage(`${payload.affected||0} forekomst(er) oppdatert. ${payload.sent||0} varsel sendt${payload.failed?`, ${payload.failed} mislyktes`:''}.`);
      close();await load();
    }catch(error){setMessage(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  };

  return <>
    <ActivityWaitlistManager activityId={activityId} organizationId={organizationId}/>

    <div className="mt-4 rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><CalendarRange size={16}/><div><p className="text-sm font-semibold">Serieadministrasjon</p><p className="text-[10px] opacity-50">Rediger, avlys eller gjenåpne forekomster</p></div></div>
        <button type="button" onClick={()=>void load()} className="rounded-lg border p-2" aria-label="Oppdater serie"><RefreshCw size={14}/></button>
      </div>

      {message&&<p className="mt-3 rounded-xl bg-black/[0.04] p-3 text-xs">{message}</p>}

      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
        {loading?<div className="flex justify-center p-6"><Loader2 className="animate-spin"/></div>:items.map((item,index)=><article key={item.id} className={`rounded-xl border p-3 ${item.id===activityId?'ring-1 ring-black/20':''}`}>
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold">{item.recurrence_sequence?`#${item.recurrence_sequence} · `:''}{new Date(`${item.activity_date}T12:00:00`).toLocaleDateString('nb-NO',{day:'numeric',month:'short',year:'numeric'})}</p><p className="mt-1 text-[11px] opacity-60">{[item.start_time?.slice(0,5),item.end_time?.slice(0,5)].filter(Boolean).join('–')}{item.location?` · ${item.location}`:''}</p><p className="mt-1 text-[10px] opacity-50">{item.registered_attendees} deltaker(e) · {item.confirmed_registrations} registrering(er)</p></div>
            <span className="rounded-full bg-black/5 px-2 py-1 text-[10px]">{statusLabel(item)}</span>
          </div>
          {item.cancellation_reason&&<p className="mt-2 rounded-lg bg-black/[0.03] p-2 text-[10px]">Årsak: {item.cancellation_reason}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button type="button" onClick={()=>open(item,'update')} className="flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px]"><Pencil size={12}/>Rediger</button>
            {item.status==='cancelled'?<button type="button" onClick={()=>open(item,'reopen')} className="flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px]"><RotateCcw size={12}/>Gjenåpne</button>:<button type="button" onClick={()=>open(item,'cancel')} className="flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px]"><XCircle size={12}/>Avlys</button>}
            <span className="hidden text-center text-[10px] opacity-40 sm:block">{index+1} av {items.length}</span>
          </div>
        </article>)}
        {!loading&&!items.length&&<p className="p-4 text-center text-xs opacity-50">Ingen serieinformasjon tilgjengelig.</p>}
      </div>

      {selected&&<div className="mt-4 rounded-2xl bg-black/[0.03] p-3">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold">{action==='update'?'Rediger forekomst':action==='cancel'?'Avlys forekomst':'Gjenåpne forekomst'}</p><button type="button" onClick={close} className="text-xs underline">Lukk</button></div>
        <label className="mt-3 block text-[10px] font-semibold uppercase opacity-50">Omfang</label>
        <select value={scope} onChange={e=>setScope(e.target.value as Scope)} className="mt-1 w-full rounded-xl border bg-white p-3 text-xs"><option value="single">Kun denne forekomsten</option><option value="following">Denne og alle kommende</option><option value="series">Hele serien</option></select>
        {action==='update'&&<div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded-xl border p-3 text-xs" placeholder="Tittel"/>
          <input type="date" value={form.activityDate} onChange={e=>setForm({...form,activityDate:e.target.value})} className="rounded-xl border p-3 text-xs"/>
          <input type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} className="rounded-xl border p-3 text-xs"/>
          <input type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} className="rounded-xl border p-3 text-xs"/>
          <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="rounded-xl border p-3 text-xs" placeholder="Sted"/>
          <input type="number" min="1" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} className="rounded-xl border p-3 text-xs" placeholder="Kapasitet"/>
        </div>}
        {action==='cancel'&&<textarea value={form.cancellationReason} onChange={e=>setForm({...form,cancellationReason:e.target.value})} className="mt-3 min-h-24 w-full rounded-xl border p-3 text-xs" placeholder="Årsak til avlysning"/>}
        <button type="button" disabled={busy} onClick={()=>void submit()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{busy?<Loader2 size={14} className="animate-spin"/>:action==='cancel'?<XCircle size={14}/>:action==='reopen'?<RotateCcw size={14}/>:<Pencil size={14}/>}Bekreft og varsle deltakere</button>
      </div>}
    </div>
  </>;
}
