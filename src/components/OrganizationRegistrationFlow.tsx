import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Building2, CheckCircle2, Loader2, MapPin, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { selectOrganization, writeStoredAdminSession } from '../lib/organization';

const organizationTypes=['Klinikk','Kosmetisk klinikk','Hudklinikk','Velværeklinikk','Tannklinikk','Fysioterapi','Moské','Kirke','Borettslag / sameie','Idrettslag','Forening','Skole','Kommunal organisasjon','Annet'];
const clinicTypes=new Set(['Klinikk','Kosmetisk klinikk','Hudklinikk','Velværeklinikk','Tannklinikk','Fysioterapi']);
const languages=['Norsk','English','Türkçe','العربية','اردو'];
const normalizeSlug=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);

function getOrganizationAppUrl(slug:string,organizationId:string){
  const host=window.location.hostname.toLowerCase();
  const isLocal=host==='localhost'||host==='127.0.0.1';
  const isPreview=host.endsWith('.vercel.app');
  if(isLocal||isPreview)return `/?org=${encodeURIComponent(organizationId)}&slug=${encodeURIComponent(slug)}`;
  return `https://${encodeURIComponent(slug)}.yasaflow.com`;
}

function getRequestedType(){
  const params=new URLSearchParams(window.location.search);
  const requested=(params.get('type')||params.get('module')||'').trim().toLowerCase();
  return requested==='clinic'||requested==='klinikk'?'Klinikk':'Forening';
}

export function OrganizationRegistrationFlow(){
  const initialType=getRequestedType();
  const [form,setForm]=useState({organizationName:'',organizationType:initialType,country:'Norge',language:'Norsk',adminName:'',email:'',password:'',slug:'',address:''});
  const [slugEdited,setSlugEdited]=useState(false);
  const [slugAvailable,setSlugAvailable]=useState<boolean|null>(null);
  const [checkingSlug,setCheckingSlug]=useState(false);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [created,setCreated]=useState(false);
  const isClinic=useMemo(()=>clinicTypes.has(form.organizationType),[form.organizationType]);
  const entityLabel=isClinic?'klinikk':'organisasjon';
  const ownerLabel=isClinic?'klinikkeier':'administrator';

  useEffect(()=>{if(!slugEdited)setForm(current=>({...current,slug:normalizeSlug(current.organizationName)}));},[form.organizationName,slugEdited]);
  useEffect(()=>{const client=supabase;const slug=normalizeSlug(form.slug);if(!client||slug.length<3){setSlugAvailable(null);return;}const timer=setTimeout(async()=>{setCheckingSlug(true);const {data}=await client.rpc('is_organization_slug_available',{p_slug:slug,p_exclude_organization_id:null});setSlugAvailable(Boolean(data));setCheckingSlug(false);},350);return()=>clearTimeout(timer);},[form.slug]);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();const client=supabase;if(!client)return setError('Supabase er ikke konfigurert.');
    if(form.password.length<8)return setError('Passordet må ha minst 8 tegn.');
    if(normalizeSlug(form.slug).length<3)return setError('Appadressen må ha minst 3 tegn.');
    if(isClinic&&!form.address.trim())return setError('Fyll inn klinikkens adresse.');
    if(slugAvailable===false)return setError('Denne appadressen er allerede opptatt.');
    setBusy(true);setError('');
    try{
      let user=(await client.auth.getSession()).data.session?.user||null;
      if(!user){const {data,error}=await client.auth.signUp({email:form.email.trim().toLowerCase(),password:form.password,options:{data:{display_name:form.adminName.trim(),account_type:isClinic?'clinic_owner':'organization_owner'}}});if(error)throw error;user=data.user;if(!data.session)throw new Error('Sjekk e-posten din og bekreft kontoen før du fortsetter registreringen.');}
      const {data,error}=await client.rpc('create_organization_onboarding',{p_name:form.organizationName.trim(),p_organization_type:form.organizationType,p_country:form.country.trim(),p_language:form.language,p_admin_name:form.adminName.trim(),p_slug:normalizeSlug(form.slug)});
      if(error)throw error;
      const organizationId=String(data?.organization_id||'');const slug=String(data?.slug||normalizeSlug(form.slug));
      if(!organizationId)throw new Error(`${isClinic?'Klinikken':'Organisasjonen'} ble opprettet, men ID mangler.`);
      if(isClinic){
        const {error:settingsError}=await client.from('organization_settings').upsert({organization_id:organizationId,display_name:form.organizationName.trim(),address:form.address.trim(),publish_address:true,updated_at:new Date().toISOString()},{onConflict:'organization_id'});
        if(settingsError)throw new Error(`Klinikken ble opprettet, men adressen kunne ikke lagres: ${settingsError.message}`);
      }
      selectOrganization(organizationId);
      writeStoredAdminSession({organization_id:organizationId,user_id:user?.id,auth_user_id:user?.id,email:form.email.trim().toLowerCase(),username:form.email.trim().toLowerCase(),display_name:form.adminName.trim(),displayName:form.adminName.trim(),role:'owner',invitation_status:'accepted',organization_type:form.organizationType});
      setCreated(true);
      setTimeout(()=>window.location.assign(getOrganizationAppUrl(slug,organizationId)),1200);
    }catch(err){setError(err instanceof Error?err.message:'Registreringen kunne ikke fullføres.');}finally{setBusy(false);}
  };

  if(created)return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><CheckCircle2 className="mx-auto text-green-600" size={46}/><h1 className="mt-4 text-2xl font-semibold">{isClinic?'Klinikken':'Organisasjonen'} er klar</h1><p className="mt-2 text-sm text-slate-500">Du sendes nå videre til {isClinic?'klinikkens':'organisasjonens'} egen Yasaflow-adresse. Prøveperioden varer i 7 dager.</p></div></div>;

  return <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-xl"><div className="mb-6 text-center"><div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white ${isClinic?'bg-fuchsia-600':'bg-blue-600'}`}>{isClinic?<Stethoscope size={26}/>:<Building2 size={26}/>}</div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Yasaflow selvbetjening</p><h1 className="mt-2 text-3xl font-semibold">Opprett {isClinic?'klinikken':'organisasjonen'} din</h1><p className="mt-2 text-sm text-slate-500">7 dager gratis prøveperiode. Ingen betaling registreres nå.</p></div>
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl">
      {!isClinic&&<div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1"><button type="button" onClick={()=>setForm({...form,organizationType:'Klinikk'})} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-500"><span className="flex items-center justify-center gap-2"><Stethoscope size={16}/> Klinikk</span></button><button type="button" onClick={()=>setForm({...form,organizationType:'Forening'})} className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-blue-700 shadow-sm"><span className="flex items-center justify-center gap-2"><Building2 size={16}/> Organisasjon</span></button></div>}
      <div><label className="text-sm font-medium">{isClinic?'Klinikknavn':'Organisasjonsnavn'}</label><input required className="mt-1 w-full rounded-xl border p-3" placeholder={isClinic?'Eksempel: Selda Esthetic':'Navnet på organisasjonen'} value={form.organizationName} onChange={e=>setForm({...form,organizationName:e.target.value})}/></div>
      {isClinic&&<div><label className="text-sm font-medium">Klinikkens adresse</label><div className="relative mt-1"><MapPin className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18}/><input required autoComplete="street-address" className="w-full rounded-xl border py-3 pl-10 pr-3" placeholder="Gateadresse, postnummer og poststed" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div><p className="mt-1 text-xs text-slate-400">Adressen brukes automatisk i klinikkens eksisterende Finn frem-kart.</p></div>}
      <div><label className="text-sm font-medium">Velg appadresse</label><div className="mt-1 flex overflow-hidden rounded-xl border bg-white"><input required className="min-w-0 flex-1 p-3 outline-none" value={form.slug} onChange={e=>{setSlugEdited(true);setForm({...form,slug:normalizeSlug(e.target.value)});}}/><span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">.yasaflow.com</span></div><p className={`mt-1 text-xs ${slugAvailable===false?'text-red-600':slugAvailable===true?'text-green-600':'text-slate-400'}`}>{checkingSlug?'Kontrollerer...':slugAvailable===true?'Adressen er ledig':slugAvailable===false?'Adressen er opptatt':'Minst 3 tegn, kun bokstaver, tall og bindestrek'}</p></div>
      {!isClinic&&<><div className="grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-medium">Organisasjonstype</label><select className="mt-1 w-full rounded-xl border p-3" value={form.organizationType} onChange={e=>setForm({...form,organizationType:e.target.value})}>{organizationTypes.filter(type=>!clinicTypes.has(type)).map(type=><option key={type}>{type}</option>)}</select></div><div><label className="text-sm font-medium">Land</label><input required className="mt-1 w-full rounded-xl border p-3" value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></div></div><div><label className="text-sm font-medium">Standardspråk</label><select className="mt-1 w-full rounded-xl border p-3" value={form.language} onChange={e=>setForm({...form,language:e.target.value})}>{languages.map(language=><option key={language}>{language}</option>)}</select></div></>}
      <div><label className="text-sm font-medium">{isClinic?'Eierens navn':'Ditt navn'}</label><input required className="mt-1 w-full rounded-xl border p-3" placeholder={`Navn på ${ownerLabel}`} value={form.adminName} onChange={e=>setForm({...form,adminName:e.target.value})}/></div>
      <div><label className="text-sm font-medium">E-post</label><input required type="email" className="mt-1 w-full rounded-xl border p-3" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
      <div><label className="text-sm font-medium">Passord</label><input required type="password" minLength={8} className="mt-1 w-full rounded-xl border p-3" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
      <div className={`rounded-2xl p-4 text-sm ${isClinic?'bg-fuchsia-50 text-fuchsia-950':'bg-blue-50 text-blue-900'}`}><div className="flex gap-2"><ShieldCheck size={18} className="shrink-0"/><p>Yasaflow reserverer appadressen og oppretter {entityLabel}, eierkonto, standardtema, moduler og 7 dagers prøveperiode.</p></div>{isClinic&&<div className="mt-3 flex gap-2 border-t border-fuchsia-200 pt-3"><Sparkles size={18} className="shrink-0"/><p>Samme kundeportal og betalingssystem brukes. Resten av klinikkprofilen kan fylles ut senere i dashboardet.</p></div>}</div>
      {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy||checkingSlug||slugAvailable===false} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white disabled:opacity-60 ${isClinic?'bg-fuchsia-600':'bg-blue-600'}`}>{busy&&<Loader2 size={17} className="animate-spin"/>}{busy?'Oppretter...':`Start 7 dagers prøveperiode for ${entityLabel}`}</button>
    </form></div></div>;
}
