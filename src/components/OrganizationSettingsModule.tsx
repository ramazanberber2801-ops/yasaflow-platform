import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Check, ChevronDown, Eye, Languages, Loader2, Save, Search, Settings } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { findLanguage, searchLanguages } from '../lib/languageRegistry';
import { notifyOrganizationModulesChanged } from '../lib/moduleEngine';
import { getSettingsTranslation } from '../lib/settingsTranslations';
import { supabase } from '../lib/supabase';

type FormState = {
  display_name:string; short_name:string; description:string; address:string; map_url:string; phone:string; email:string; website:string;
  whatsapp_number:string; donation_number:string; donation_url:string; bank_account:string; iban:string;
  opening_hours:string; weekly_event:string; logo_url:string; app_icon_url:string;
  publish_phone:boolean; publish_email:boolean; publish_address:boolean; publish_website:boolean; publish_opening_hours:boolean;
  ramadan_enabled:boolean; ramadan_start_date:string; ramadan_end_date:string;
  kurban_enabled:boolean; kurban_start_date:string;
  language:string;
};

const empty:FormState={display_name:'',short_name:'',description:'',address:'',map_url:'',phone:'',email:'',website:'',whatsapp_number:'',donation_number:'',donation_url:'',bank_account:'',iban:'',opening_hours:'',weekly_event:'',logo_url:'',app_icon_url:'',publish_phone:false,publish_email:false,publish_address:false,publish_website:false,publish_opening_hours:false,ramadan_enabled:false,ramadan_start_date:'',ramadan_end_date:'',kurban_enabled:false,kurban_start_date:'',language:'nb'};

export function OrganizationSettingsModule({organizationId}:{organizationId:string}){
  const {language:appLanguage}=useAppI18n();
  const t=(key:string)=>getSettingsTranslation(appLanguage,key);
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
  },[organizationId,appLanguage]);

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
      supabase.from('organization_modules').upsert({organization_id:organizationId,module_id:'daily_inspiration',enabled:dailyInspiration,status:dailyInspiration?t('settings.active'):t('settings.off'),updated_at:now},{onConflict:'organization_id,module_id'}),
      supabase.from('organizations').update({language,updated_at:now}).eq('id',organizationId),
    ]);
    setSaving(false);
    const saveError=settingsResult.error||moduleResult.error||organizationResult.error;
    if(saveError){setError(saveError.message);return;}
    notifyOrganizationModulesChanged(organizationId);
    window.dispatchEvent(new CustomEvent('yasaflow-organization-settings-changed',{detail:{organizationId,language}}));
    setMessage(t('settings.saved'));
  };

  const field=(key:keyof FormState,label:string,type='text')=><label className="block"><span className="text-xs font-medium">{label}</span><input type={type} className="mt-1 w-full rounded-xl border p-3 text-sm" value={String(form[key]??'')} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>;
  const publishChoice=(key:'publish_phone'|'publish_email'|'publish_address'|'publish_website'|'publish_opening_hours',label:string,hasValue:boolean)=><label className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${hasValue?'':'opacity-50'}`}><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs opacity-55">{hasValue?t('settings.publicVisible'):t('settings.fillFirst')}</p></div><input type="checkbox" className="h-5 w-5" disabled={!hasValue} checked={form[key]} onChange={e=>setForm({...form,[key]:e.target.checked})}/></label>;
  if(loading)return <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>;

  return <form onSubmit={save} className="space-y-4">
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><Settings style={{color:'var(--brand-primary)'}}/><div><h3 className="font-serif text-2xl">{t('settings.title')}</h3><p className="text-sm opacity-55">{t('settings.subtitle')}</p></div></div></section>

    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3"><Languages size={20} style={{color:'var(--brand-primary)'}}/><div><h4 className="font-semibold">{t('settings.appLanguage')}</h4><p className="mt-1 text-xs opacity-55">{t('settings.languageHelp')}</p></div></div>
      <div className="relative mt-4">
        <button type="button" onClick={()=>setLanguageOpen(!languageOpen)} className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left"><span><span className="block text-sm font-semibold">{selectedLanguage.nativeName}</span><span className="block text-xs opacity-50">{selectedLanguage.name} · {selectedLanguage.code.toUpperCase()}{selectedLanguage.direction==='rtl'?' · RTL':''}</span></span><ChevronDown size={18} className={`transition ${languageOpen?'rotate-180':''}`}/></button>
        {languageOpen&&<div className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border bg-white p-3 shadow-2xl"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35"/><input autoFocus value={languageQuery} onChange={e=>setLanguageQuery(e.target.value)} placeholder={t('settings.searchLanguage')} className="w-full rounded-xl border py-3 pl-9 pr-3 text-sm outline-none"/></div><div className="mt-2 max-h-64 overflow-y-auto">{filteredLanguages.length===0?<p className="p-4 text-center text-sm opacity-50">{t('settings.noLanguage')}</p>:filteredLanguages.map(language=><button key={language.code} type="button" onClick={()=>{setForm({...form,language:language.code});setLanguageOpen(false);setLanguageQuery('');}} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-black/5"><span><span className="block text-sm font-semibold">{language.nativeName}</span><span className="block text-xs opacity-50">{language.name} · {language.code.toUpperCase()}{language.direction==='rtl'?' · RTL':''}</span></span>{form.language===language.code&&<Check size={17} style={{color:'var(--brand-primary)'}}/>}</button>)}</div></div>}
      </div>
      <p className="mt-3 text-xs opacity-50">{t('settings.languageNote')}</p>
    </section>

    <section className="grid gap-4 rounded-3xl border bg-white p-5 shadow-sm sm:grid-cols-2">
      {field('display_name',t('settings.displayName'))}{field('short_name',t('settings.shortName'))}
      <label className="block sm:col-span-2"><span className="text-xs font-medium">{t('settings.description')}</span><textarea rows={5} className="mt-1 w-full rounded-xl border p-3 text-sm" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      {field('website',t('settings.website'),'url')}{field('phone',t('settings.phone'))}{field('email',t('settings.email'),'email')}{field('whatsapp_number',t('settings.whatsapp'))}{field('address',t('settings.address'))}{field('map_url',t('settings.mapUrl'),'url')}{field('logo_url',t('settings.logoUrl'),'url')}{field('app_icon_url',t('settings.appIconUrl'),'url')}{field('donation_number',t('settings.donationNumber'))}{field('donation_url',t('settings.donationUrl'),'url')}{field('bank_account',t('settings.bankAccount'))}{field('iban',t('settings.iban'))}{field('opening_hours',t('settings.openingHours'))}{field('weekly_event',t('settings.weeklyEvent'))}
    </section>

    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><Eye size={20} style={{color:'var(--brand-primary)'}}/><div><h4 className="font-semibold">{t('settings.publicTitle')}</h4><p className="mt-1 text-xs opacity-55">{t('settings.publicSubtitle')}</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{publishChoice('publish_phone',t('settings.phone'),Boolean(form.phone.trim()))}{publishChoice('publish_email',t('settings.email'),Boolean(form.email.trim()))}{publishChoice('publish_address',t('settings.address'),Boolean(form.address.trim()))}{publishChoice('publish_website',t('settings.website'),Boolean(form.website.trim()))}{publishChoice('publish_opening_hours',t('settings.openingHours'),Boolean(form.opening_hours.trim()))}</div></section>

    <section className="rounded-3xl border bg-white p-5 shadow-sm"><h4 className="font-semibold">{t('settings.optionalModules')}</h4><div className="mt-4 space-y-4"><label className="flex items-start justify-between gap-4 rounded-2xl border p-4"><div className="flex gap-3"><BookOpen size={20} style={{color:'var(--brand-primary)'}}/><div><p className="text-sm font-semibold">{t('settings.dailyTitle')}</p><p className="mt-1 text-xs leading-5 opacity-55">{t('settings.dailyBody')}</p></div></div><input type="checkbox" className="mt-1 h-5 w-5" checked={dailyInspiration} onChange={e=>setDailyInspiration(e.target.checked)}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ramadan_enabled} onChange={e=>setForm({...form,ramadan_enabled:e.target.checked})}/>{t('settings.enableRamadan')}</label>{form.ramadan_enabled&&<div className="grid gap-3 sm:grid-cols-2">{field('ramadan_start_date',t('settings.startDate'),'date')}{field('ramadan_end_date',t('settings.endDate'),'date')}</div>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.kurban_enabled} onChange={e=>setForm({...form,kurban_enabled:e.target.checked})}/>{t('settings.enableKurban')}</label>{form.kurban_enabled&&field('kurban_start_date',t('settings.startDate'),'date')}</div></section>
    {error&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}{message&&<p className="rounded-xl bg-green-50 p-3 text-xs text-green-700">{message}</p>}
    <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>} {t('settings.save')}</button>
  </form>;
}
