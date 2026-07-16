import { useState, type FormEvent } from 'react';
import { Building2, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { selectOrganization, writeStoredAdminSession } from '../lib/organization';

const organizationTypes = ['Moské','Kirke','Borettslag / sameie','Idrettslag','Forening','Skole','Kommunal organisasjon','Annet'];
const languages = ['Norsk','English','Türkçe','العربية','اردو'];

export function OrganizationRegistrationFlow() {
  const [form,setForm]=useState({organizationName:'',organizationType:'Forening',country:'Norge',language:'Norsk',adminName:'',email:'',password:''});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [created,setCreated]=useState(false);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();const client=supabase;if(!client)return setError('Supabase er ikke konfigurert.');
    if(form.password.length<8)return setError('Passordet må ha minst 8 tegn.');
    setBusy(true);setError('');
    try{
      let user=(await client.auth.getSession()).data.session?.user||null;
      if(!user){
        const {data,error}=await client.auth.signUp({email:form.email.trim().toLowerCase(),password:form.password,options:{data:{display_name:form.adminName.trim()}}});
        if(error)throw error;
        user=data.user;
        if(!data.session)throw new Error('Sjekk e-posten din og bekreft kontoen før du fortsetter registreringen.');
      }
      const {data,error}=await client.rpc('create_organization_onboarding',{
        p_name:form.organizationName.trim(),p_organization_type:form.organizationType,p_country:form.country.trim(),p_language:form.language,p_admin_name:form.adminName.trim(),
      });
      if(error)throw error;
      const organizationId=String(data?.organization_id||'');
      if(!organizationId)throw new Error('Organisasjonen ble opprettet, men ID mangler.');
      selectOrganization(organizationId);
      writeStoredAdminSession({organization_id:organizationId,user_id:user?.id,auth_user_id:user?.id,email:form.email.trim().toLowerCase(),username:form.email.trim().toLowerCase(),display_name:form.adminName.trim(),displayName:form.adminName.trim(),role:'owner',invitation_status:'accepted'});
      setCreated(true);
      setTimeout(()=>window.location.assign(`/?org=${encodeURIComponent(organizationId)}`),1200);
    }catch(err){setError(err instanceof Error?err.message:'Registreringen kunne ikke fullføres.');}
    finally{setBusy(false);}
  };

  if(created)return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><CheckCircle2 className="mx-auto text-green-600" size={46}/><h1 className="mt-4 text-2xl font-semibold">Organisasjonen er klar</h1><p className="mt-2 text-sm text-slate-500">Du sendes nå videre til Yasaflow. Prøveperioden varer i 7 dager.</p></div></div>;

  return <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white"><Building2 size={26}/></div><h1 className="mt-4 text-3xl font-semibold">Opprett organisasjonen din</h1><p className="mt-2 text-sm text-slate-500">7 dager gratis prøveperiode. Ingen betaling registreres nå.</p></div>
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl">
        <div><label className="text-sm font-medium">Organisasjonsnavn</label><input required className="mt-1 w-full rounded-xl border p-3" value={form.organizationName} onChange={e=>setForm({...form,organizationName:e.target.value})}/></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-medium">Organisasjonstype</label><select className="mt-1 w-full rounded-xl border p-3" value={form.organizationType} onChange={e=>setForm({...form,organizationType:e.target.value})}>{organizationTypes.map(type=><option key={type}>{type}</option>)}</select></div><div><label className="text-sm font-medium">Land</label><input required className="mt-1 w-full rounded-xl border p-3" value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></div></div>
        <div><label className="text-sm font-medium">Standardspråk</label><select className="mt-1 w-full rounded-xl border p-3" value={form.language} onChange={e=>setForm({...form,language:e.target.value})}>{languages.map(language=><option key={language}>{language}</option>)}</select></div>
        <div><label className="text-sm font-medium">Ditt navn</label><input required className="mt-1 w-full rounded-xl border p-3" value={form.adminName} onChange={e=>setForm({...form,adminName:e.target.value})}/></div>
        <div><label className="text-sm font-medium">E-post</label><input required type="email" className="mt-1 w-full rounded-xl border p-3" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div><label className="text-sm font-medium">Passord</label><input required type="password" minLength={8} className="mt-1 w-full rounded-xl border p-3" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900"><div className="flex gap-2"><ShieldCheck size={18} className="shrink-0"/><p>Yasaflow oppretter organisasjon, første administrator, standardtema, standardmoduler og 7 dagers prøveperiode automatisk.</p></div></div>
        {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white disabled:opacity-60">{busy&&<Loader2 size={17} className="animate-spin"/>}{busy?'Oppretter...':'Start 7 dagers prøveperiode'}</button>
      </form>
    </div>
  </div>;
}
