import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Check, ChevronDown, Languages, Loader2, Save, Search, Settings } from 'lucide-react';
import { APP_LANGUAGES, findLanguage, searchLanguages } from '../lib/languageRegistry';
import { notifyOrganizationModulesChanged } from '../lib/moduleEngine';
import { supabase } from '../lib/supabase';

type FormState = {
  display_name:string; short_name:string; address:string; map_url:string; phone:string; email:string;
  whatsapp_number:string; donation_number:string; donation_url:string; bank_account:string; iban:string;
  opening_hours:string; weekly_event:string; logo_url:string; app_icon_url:string;
  ramadan_enabled:boolean; ramadan_start_date:string; ramadan_end_date:string;
  kurban_enabled:boolean; kurban_start_date:string;
  language:string;
};

const empty:FormState={display_name:'',short_name:'',address:'',map_url:'',phone:'',email:'',whatsapp_number:'',donation_number:'',donation_url:'',bank_account:'',iban:'',opening_hours:'',weekly_event:'',logo_url:'',app_icon_url:'',ramadan_enabled:false,ramadan_start_date:'',ramadan_end_date:'',kurban_enabled:false,kurban_start_date:'',language:'nb'};

export function OrganizationSettingsModule({organizationId}:{organizationId:string}){
  const [form,setForm]=useState<FormState>(empty);
  const [dailyInspiration,setDailyInspiration]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [languageOpen,setLanguageOpen]=useState(false);
  const [languageQuery,setLanguageQuery]=useState('');

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!supabase){setLoading(false);return;}
      setLoading(true);setError('');setMessage('');
      const [settingsResult,moduleResult,organizationResult]=await Promise.all([
        supabase.from('organization_settings').select('*').eq('organization_id',organizationId).maybeSingle(),
        supabase.from('organization_modules').select('enabled').eq('organization_id',organizationId).eq('module_id','daily_inspiration').maybeSingle(),
        supabase.from('organizations').select('language').eq('id',organizationId).maybeSingle(),
      ]);
      if(cancelled)return;
      if(settingsResult.error)setError(settingsResult.error.message);
      else {
        const language=findLanguage(organizationResult.data?.language).code;
        setForm(settingsResult.data?{...empty,...settingsResult.data,language,ramadan_start_date:settingsResult.data.ramadan_start_date||'',ramadan_end_date:settingsResult.data.ramadan_end_date||'',kurban_start_date:settingsResult.data.kurban_start_date||''}:{...empty,language});
      }
      if(moduleResult.error)setError(moduleResult.error.message);
      else setDailyInspiration(Boolean(moduleResult.data?.enabled));
      setLoading(false);
    })();
    return()=>{cancelled=true;};
  },[organizationId]);

  const filteredLanguages=useMemo(()=>searchLanguages(languageQuery),[languageQuery]);
  const selectedLanguage=findLanguage(form.language);

  const save=async(e:FormEvent)=>{
    e.preventDefault();
    if(!supabase)return;
    setSaving(true);setError('');setMessage('');
    const now=new Date().toISOString();
    const {language,...settingsPayload}=form;
    const [settingsResult,moduleResult,organizationResult]=await Promise.all([
      supabase.from('organization_settings').upsert({...settingsPayload,organization_id:organizationId,updated_at:now},{onConflict:'organization_id'}),
      supabase.from('organization_modules').upsert({organization_id:organizationId,module_id:'daily_inspiration',enabled:dailyInspiration,status:dailyInspiration?'Aktiv':'Av',updated_at:now},{onConflict:'organization_id,module_id'}),
      supabase.from('organizations').update({language,updated_at:now}).eq('id',organizationId),
    ]);
    setSaving(false);
    const saveError=settingsResult.error||moduleResult.error||organizationResult.error;
    if(saveError){setError(saveError.message);return;}
    notifyOrganizationModulesChanged(organizationId);
    window.dispatchEvent(new CustomEvent('yasaflow-organization-settings-changed',{detail:{organizationId,language}}));
    setMessage('Innstillingene er lagret. Språket oppdateres i appen.');
  };

  const field=(key:keyof FormState,label:string,type='text')=><label className="block"><span className="text-xs font-medium">{label}</span><input type={type} className="mt-1 w-full rounded-xl border p-3 text-sm" value={String(form[key]??'')} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>;
  if(loading)return <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>;

  return <form onSubmit={save} className="space-y-4">
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><Settings style={{color:'var(--brand-primary)'}}/><div><h3 className="font-serif text-2xl">Organisasjonsinnstillinger</h3><p className="text-sm opacity-55">Kontakt, profil, språk, donasjon og valgfrie moduler.</p></div></div></section>

    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3"><Languages size={20} style={{color:'var(--brand-primary)'}}/><div><h4 className="font-semibold">Appspråk</h4><p className="mt-1 text-xs opacity-55">Søk etter språk i stedet for å bla gjennom hele listen.</p></div></div>
      <div className="relative mt-4">
        <button type="button" onClick={()=>setLanguageOpen(!languageOpen)} className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left">
          <span><span className="block text-sm font-semibold">{selectedLanguage.nativeName}</span><span className="block text-xs opacity-50">{selectedLanguage.name} · {selectedLanguage.code.toUpperCase()}{selectedLanguage.direction==='rtl'?' · RTL':''}</span></span>
          <ChevronDown size={18} className={`transition ${languageOpen?'rotate-180':''}`}/>
        </button>
        {languageOpen&&<div className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border bg-white p-3 shadow-2xl">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35"/><input autoFocus value={languageQuery} onChange={e=>setLanguageQuery(e.target.value)} placeholder="Søk: norsk, urdu, arabisk, tysk..." className="w-full rounded-xl border py-3 pl-9 pr-3 text-sm outline-none"/></div>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {filteredLanguages.length===0?<p className="p-4 text-center text-sm opacity-50">Ingen språk funnet.</p>:filteredLanguages.map(language=><button key={language.code} type="button" onClick={()=>{setForm({...form,language:language.code});setLanguageOpen(false);setLanguageQuery('');}} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-black/5"><span><span className="block text-sm font-semibold">{language.nativeName}</span><span className="block text-xs opacity-50">{language.name} · {language.code.toUpperCase()}{language.direction==='rtl'?' · RTL':''}</span></span>{form.language===language.code&&<Check size={17} style={{color:'var(--brand-primary)'}}/>}</button>)}
          </div>
        </div>}
      </div>
      <p className="mt-3 text-xs opacity-50">Nye språk kan legges til sentralt uten å bygge om denne menyen.</p>
    </section>

    <section className="grid gap-4 rounded-3xl border bg-white p-5 shadow-sm sm:grid-cols-2">{field('display_name','Visningsnavn')}{field('short_name','Kort navn')}{field('phone','Telefon')}{field('email','E-post','email')}{field('whatsapp_number','WhatsApp')}{field('address','Adresse')}{field('map_url','Kartlenke','url')}{field('logo_url','Logo-URL','url')}{field('app_icon_url','Appikon-URL','url')}{field('donation_number','Donasjonsnummer')}{field('donation_url','Donasjonslenke','url')}{field('bank_account','Bankkonto')}{field('iban','IBAN')}{field('opening_hours','Åpningstider')}{field('weekly_event','Ukentlig arrangement')}</section>
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <h4 className="font-semibold">Valgfrie moduler</h4>
      <div className="mt-4 space-y-4">
        <label className="flex items-start justify-between gap-4 rounded-2xl border p-4"><div className="flex gap-3"><BookOpen size={20} style={{color:'var(--brand-primary)'}}/><div><p className="text-sm font-semibold">Dagens vers og hadith</p><p className="mt-1 text-xs leading-5 opacity-55">Vis et daglig vers og en hadith på forsiden. Passer for moskeer og islamske organisasjoner, men er valgfritt.</p></div></div><input type="checkbox" className="mt-1 h-5 w-5" checked={dailyInspiration} onChange={e=>setDailyInspiration(e.target.checked)}/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ramadan_enabled} onChange={e=>setForm({...form,ramadan_enabled:e.target.checked})}/>Aktiver Ramadan</label>
        {form.ramadan_enabled&&<div className="grid gap-3 sm:grid-cols-2">{field('ramadan_start_date','Startdato','date')}{field('ramadan_end_date','Sluttdato','date')}</div>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.kurban_enabled} onChange={e=>setForm({...form,kurban_enabled:e.target.checked})}/>Aktiver Kurban</label>
        {form.kurban_enabled&&field('kurban_start_date','Startdato','date')}
      </div>
    </section>
    {error&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}{message&&<p className="rounded-xl bg-green-50 p-3 text-xs text-green-700">{message}</p>}
    <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Lagre innstillinger</button>
  </form>;
}
