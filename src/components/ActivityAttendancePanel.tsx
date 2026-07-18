import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Camera, CameraOff, CheckCircle2, ClipboardList, Download, Loader2, Mail, QrCode, RefreshCw, UserCheck, Users, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Activity={id:string;title:string;activity_date:string};
type Attendance={checkin_id:string;membership_id:string|null;member_number:string|null;full_name:string;email:string|null;checked_in_at:string;source:string};
type Registration={registration_id:string;full_name:string;email:string;phone:string|null;attendees:number;status:string;created_at:string;membership_id:string|null;member_number:string|null;checked_in:boolean;checked_in_at:string|null;payment_confirmed:boolean;confirmation_email_sent_at:string|null;ticket_token:string};
type ScanResult={kind:'success'|'duplicate'|'error';message:string};
type DetectorResult={rawValue?:string};
type Detector={detect:(source:CanvasImageSource)=>Promise<DetectorResult[]>};
type DetectorConstructor={new(options:{formats:string[]}):Detector};

const csvCell=(value:unknown)=>`"${String(value??'').replace(/"/g,'""')}"`;
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ActivityAttendancePanel({organizationId,activity,onClose}:{organizationId:string;activity:Activity;onClose:()=>void}){
  const [attendance,setAttendance]=useState<Attendance[]>([]);
  const [registrations,setRegistrations]=useState<Registration[]>([]);
  const [loading,setLoading]=useState(true);
  const [code,setCode]=useState('');
  const [checking,setChecking]=useState(false);
  const [result,setResult]=useState<ScanResult|null>(null);
  const [cameraOn,setCameraOn]=useState(false);
  const [cameraError,setCameraError]=useState('');
  const [resendingId,setResendingId]=useState('');
  const [promotingId,setPromotingId]=useState('');
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const timerRef=useRef<number|null>(null);
  const busyRef=useRef(false);

  const loadData=async()=>{
    if(!supabase)return;
    setLoading(true);
    const [attendanceResult,registrationResult]=await Promise.all([
      supabase.rpc('get_activity_attendance',{p_activity_id:activity.id}),
      supabase.rpc('get_activity_registration_overview',{p_activity_id:activity.id}),
    ]);
    if(attendanceResult.error)setResult({kind:'error',message:attendanceResult.error.message});
    else setAttendance((attendanceResult.data||[]) as Attendance[]);
    if(registrationResult.error)setResult({kind:'error',message:registrationResult.error.message});
    else setRegistrations((registrationResult.data||[]) as Registration[]);
    setLoading(false);
  };

  useEffect(()=>{void loadData();return()=>stopCamera();},[activity.id]);

  const stopCamera=()=>{
    if(timerRef.current)window.clearInterval(timerRef.current);
    timerRef.current=null;
    streamRef.current?.getTracks().forEach(track=>track.stop());
    streamRef.current=null;
    setCameraOn(false);
  };

  const checkIn=async(raw:string)=>{
    if(!supabase||busyRef.current)return;
    const value=raw.trim();
    busyRef.current=true;setChecking(true);setResult(null);
    try{
      const ticketPrefix=`yasaflow-ticket:${organizationId}:${activity.id}:`;
      if(value.startsWith(ticketPrefix)){
        const token=value.slice(ticketPrefix.length);
        if(!uuidPattern.test(token))throw new Error('Ugyldig arrangementsbillett.');
        const {data,error}=await supabase.rpc('check_in_registration_by_ticket',{p_organization_id:organizationId,p_activity_id:activity.id,p_ticket_token:token});
        if(error)throw error;
        const payload=data as {status?:string;full_name?:string};
        setResult(payload.status==='already_checked_in'?{kind:'duplicate',message:`${payload.full_name||'Deltakeren'} er allerede sjekket inn.`}:{kind:'success',message:`${payload.full_name||'Deltakeren'} er sjekket inn.`});
      }else{
        const memberPrefix=`yasaflow-member:${organizationId}:`;
        const token=value.startsWith(memberPrefix)?value.slice(memberPrefix.length):value;
        if(!uuidPattern.test(token))throw new Error('QR-koden tilhører ikke dette arrangementet eller organisasjonen.');
        const {data,error}=await supabase.rpc('check_in_member_by_card',{p_organization_id:organizationId,p_activity_id:activity.id,p_card_token:token});
        if(error)throw error;
        const payload=data as {status?:string};
        setResult(payload.status==='already_checked_in'?{kind:'duplicate',message:'Medlemmet er allerede sjekket inn.'}:{kind:'success',message:'Medlemmet er sjekket inn.'});
      }
      setCode('');await loadData();
    }catch(error){
      const message=error instanceof Error?error.message:String(error);
      setResult({kind:'error',message:message.includes('ticket_not_found')?'Billetten er ugyldig, avmeldt eller står på venteliste.':message.includes('not_authorized')?'Du har ikke tilgang til innsjekking.':message});
    }finally{setChecking(false);busyRef.current=false;}
  };

  const resendTicket=async(row:Registration)=>{
    if(!supabase||resendingId)return;
    setResendingId(row.registration_id);
    setResult(null);
    try{
      const {data:sessionData}=await supabase.auth.getSession();
      const accessToken=sessionData.session?.access_token;
      if(!accessToken)throw new Error('Du må være innlogget for å sende billetten på nytt.');
      const response=await fetch('/api/send-activity-ticket',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${accessToken}`},
        body:JSON.stringify({registrationId:row.registration_id,ticketToken:row.ticket_token,force:true}),
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload?.error||'Billetten kunne ikke sendes.');
      setResult({kind:'success',message:`Billetten er sendt på nytt til ${row.email}.`});
      await loadData();
    }catch(error){
      setResult({kind:'error',message:error instanceof Error?error.message:String(error)});
    }finally{setResendingId('');}
  };

  const promoteWaitlist=async(row:Registration)=>{
    if(!supabase||promotingId)return;
    if(!window.confirm(`Bekreft plass for ${row.full_name}? En aktiv QR-billett sendes automatisk.`))return;
    setPromotingId(row.registration_id);
    setResult(null);
    try{
      const {data,error}=await supabase.rpc('promote_activity_waitlist_registration',{p_registration_id:row.registration_id});
      if(error)throw error;
      const payload=data as {full_name?:string;email?:string};
      setResult({kind:'success',message:`${payload.full_name||row.full_name} er flyttet fra venteliste. QR-billett sendes til ${payload.email||row.email}.`});
      await loadData();
    }catch(error){
      const message=error instanceof Error?error.message:String(error);
      setResult({kind:'error',message:message.includes('capacity_exceeded')?'Det er ikke nok ledige plasser til denne påmeldingen.':message.includes('registration_not_waitlisted')?'Påmeldingen står ikke lenger på venteliste.':message.includes('not_authorized')?'Du har ikke tilgang til å endre ventelisten.':message});
    }finally{setPromotingId('');}
  };

  const startCamera=async()=>{
    setCameraError('');
    const DetectorClass=(window as unknown as {BarcodeDetector?:DetectorConstructor}).BarcodeDetector;
    if(!DetectorClass){setCameraError('Kameraskanning støttes ikke i denne nettleseren. Bruk Chrome på mobil eller lim inn koden.');return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();}
      setCameraOn(true);
      const detector=new DetectorClass({formats:['qr_code']});
      timerRef.current=window.setInterval(async()=>{
        const video=videoRef.current;if(!video||video.readyState<2||busyRef.current)return;
        try{const found=await detector.detect(video);const value=found[0]?.rawValue;if(value){stopCamera();await checkIn(value);}}catch{/* continue scanning */}
      },500);
    }catch{setCameraError('Kamera kunne ikke åpnes. Kontroller kameratillatelsen.');stopCamera();}
  };

  const submit=(event:FormEvent)=>{event.preventDefault();void checkIn(code);};
  const downloadCsv=(rows:unknown[][],name:string)=>{const content='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\n');const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`${name.toLowerCase().replace(/[^a-z0-9æøå]+/gi,'-')}.csv`;link.click();URL.revokeObjectURL(url);};
  const exportRegistrations=()=>downloadCsv([['Navn','E-post','Telefon','Antall','Status','Betaling bekreftet','E-post sendt','Sjekket inn'],...registrations.map(row=>[row.full_name,row.email,row.phone,row.attendees,row.status,row.payment_confirmed?'Ja':'Nei',row.confirmation_email_sent_at?'Ja':'Nei',row.checked_in?'Ja':'Nei'])],`pameldinger-${activity.title}`);
  const exportAttendance=()=>downloadCsv([['Navn','Medlemsnummer','E-post','Innsjekket','Metode'],...attendance.map(row=>[row.full_name,row.member_number,row.email,new Date(row.checked_in_at).toLocaleString('nb-NO'),row.source])],`oppmote-${activity.title}`);
  const stats=useMemo(()=>({registered:registrations.filter(row=>row.status==='confirmed').reduce((sum,row)=>sum+row.attendees,0),waitlist:registrations.filter(row=>row.status==='waitlist').reduce((sum,row)=>sum+row.attendees,0),checkedIn:attendance.length}),[registrations,attendance]);

  return <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/55 p-0 sm:p-4"><div className="mx-auto min-h-full w-full max-w-5xl bg-white p-5 sm:min-h-0 sm:rounded-3xl">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest opacity-45">Arrangement Pro</p><h3 className="font-serif text-2xl">QR-billetter og innsjekk</h3><p className="mt-1 text-sm opacity-60">{activity.title} · {activity.activity_date}</p></div><button onClick={()=>{stopCamera();onClose();}} className="rounded-full bg-black/5 p-2" aria-label="Lukk"><XCircle size={20}/></button></div>
    <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-black/[0.03] p-3 text-center"><p className="text-xl font-semibold">{stats.registered}</p><p className="text-[11px] opacity-50">Påmeldte</p></div><div className="rounded-2xl bg-black/[0.03] p-3 text-center"><p className="text-xl font-semibold">{stats.waitlist}</p><p className="text-[11px] opacity-50">Venteliste</p></div><div className="rounded-2xl bg-black/[0.03] p-3 text-center"><p className="text-xl font-semibold">{stats.checkedIn}</p><p className="text-[11px] opacity-50">Møtt</p></div></div>
    {result&&<div className={`mt-4 flex gap-2 rounded-xl p-3 text-sm ${result.kind==='success'?'bg-green-50 text-green-800':result.kind==='duplicate'?'bg-amber-50 text-amber-800':'bg-red-50 text-red-800'}`}>{result.kind==='success'?<CheckCircle2 size={18}/>:<XCircle size={18}/>}<p className="font-semibold">{result.message}</p></div>}
    <section className="mt-5 rounded-2xl border p-4"><div className="flex items-center gap-2"><QrCode size={18}/><h4 className="font-semibold">Skann billett eller medlemskort</h4></div><p className="mt-1 text-xs opacity-55">Unike arrangementsbilletter kan bare brukes én gang. Medlemskort støttes fortsatt.</p><div className="mt-4 overflow-hidden rounded-2xl bg-black"><video ref={videoRef} playsInline muted className={`aspect-video w-full object-cover ${cameraOn?'block':'hidden'}`}/>{!cameraOn&&<div className="flex aspect-video items-center justify-center text-white/55"><Camera size={42}/></div>}</div><button onClick={cameraOn?stopCamera:()=>void startCamera()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold">{cameraOn?<><CameraOff size={17}/>Stopp kamera</>:<><Camera size={17}/>Åpne kamera</>}</button>{cameraError&&<p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{cameraError}</p>}<form onSubmit={submit} className="mt-4"><label className="text-xs font-medium">Manuell QR-kode eller token<input value={code} onChange={event=>setCode(event.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm" placeholder="yasaflow-ticket:..."/></label><button disabled={checking||!code.trim()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{checking&&<Loader2 size={16} className="animate-spin"/>}Registrer innsjekk</button></form></section>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><ClipboardList size={18}/><h4 className="font-semibold">Påmeldinger</h4></div><button onClick={exportRegistrations} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs"><Download size={14}/>CSV</button></div>{loading?<div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>:<div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto">{registrations.map(row=><article key={row.registration_id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{row.full_name}</p><p className="text-xs opacity-55">{row.email} · {row.attendees} deltaker(e)</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${row.status==='confirmed'?'bg-green-50 text-green-700':row.status==='cancelled'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700'}`}>{row.status}</span></div><div className="mt-2 flex flex-wrap gap-2 text-[10px]"><span className="rounded-full bg-black/5 px-2 py-1">Betaling: {row.payment_confirmed?'bekreftet':'ikke bekreftet'}</span><span className="rounded-full bg-black/5 px-2 py-1">E-post: {row.confirmation_email_sent_at?'sendt':'venter'}</span><span className="rounded-full bg-black/5 px-2 py-1">{row.checked_in?'Sjekket inn':'Ikke møtt'}</span></div>{row.status==='waitlist'&&<button type="button" disabled={promotingId===row.registration_id} onClick={()=>void promoteWaitlist(row)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45" style={{background:'var(--brand-primary)'}}>{promotingId===row.registration_id?<Loader2 size={15} className="animate-spin"/>:<UserCheck size={15}/>}Bekreft plass og send QR-billett</button>}<button type="button" disabled={resendingId===row.registration_id||row.status==='cancelled'||!row.ticket_token} onClick={()=>void resendTicket(row)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45">{resendingId===row.registration_id?<Loader2 size={15} className="animate-spin"/>:<><Mail size={15}/><RefreshCw size={13}/></>}Send billett på nytt</button></article>)}{!registrations.length&&<p className="rounded-xl bg-black/[0.03] p-5 text-center text-sm opacity-55">Ingen påmeldinger ennå.</p>}</div>}</section>
      <section className="rounded-2xl border p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Users size={18}/><h4 className="font-semibold">Oppmøte</h4></div><button onClick={exportAttendance} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs"><Download size={14}/>CSV</button></div><div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto">{attendance.map(row=><article key={row.checkin_id} className="rounded-xl border p-3"><p className="text-sm font-semibold">{row.full_name}</p><p className="text-xs opacity-55">{row.email||'Ingen e-post'} · {new Date(row.checked_in_at).toLocaleString('nb-NO')}</p><p className="mt-1 text-[10px] uppercase tracking-wide opacity-45">{row.source==='ticket_qr'?'Arrangementbillett':row.source}</p></article>)}{!attendance.length&&<p className="rounded-xl bg-black/[0.03] p-5 text-center text-sm opacity-55">Ingen er sjekket inn ennå.</p>}</div></section></div>
  </div></div>;
}
