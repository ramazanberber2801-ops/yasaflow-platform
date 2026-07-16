import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Rocket } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getOnboardingTranslation } from '../lib/onboardingTranslations';
import { supabase } from '../lib/supabase';

type Section = 'settings' | 'administration' | 'news' | 'activities' | 'notifications';
type ChecklistState = { profile:boolean; logo:boolean; staff:boolean; news:boolean; activity:boolean };

const initialState:ChecklistState={profile:false,logo:false,staff:false,news:false,activity:false};

export function OrganizationOnboardingChecklist({organizationId,onNavigate}:{organizationId:string;onNavigate:(section:Section)=>void}){
  const {language}=useAppI18n();
  const t=(key:string)=>getOnboardingTranslation(language,key);
  const [state,setState]=useState<ChecklistState>(initialState);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      if(!supabase){setLoading(false);return;}
      const [settingsResult,staffResult,newsResult,activityResult]=await Promise.all([
        supabase.from('organization_settings').select('display_name, email, phone, address, logo_url, app_icon_url').eq('organization_id',organizationId).maybeSingle(),
        supabase.from('organization_staff').select('*',{count:'exact',head:true}).eq('organization_id',organizationId).eq('active',true),
        supabase.from('organization_news').select('*',{count:'exact',head:true}).eq('organization_id',organizationId),
        supabase.from('organization_activities').select('*',{count:'exact',head:true}).eq('organization_id',organizationId),
      ]);
      if(cancelled)return;
      const settings=settingsResult.data;
      setState({profile:Boolean(settings?.display_name&&(settings.email||settings.phone||settings.address)),logo:Boolean(settings?.logo_url||settings?.app_icon_url),staff:(staffResult.count||0)>0,news:(newsResult.count||0)>0,activity:(activityResult.count||0)>0});
      setLoading(false);
    };
    void load();
    const refresh=(event:Event)=>{const custom=event as CustomEvent<{organizationId?:string}>;if(!custom.detail?.organizationId||custom.detail.organizationId===organizationId)void load();};
    window.addEventListener('yasaflow-organization-settings-changed',refresh);
    return()=>{cancelled=true;window.removeEventListener('yasaflow-organization-settings-changed',refresh);};
  },[organizationId,language]);

  const items=useMemo(()=>[
    {key:'profile' as const,label:t('onboarding.profileTitle'),description:t('onboarding.profileBody'),section:'settings' as const},
    {key:'logo' as const,label:t('onboarding.logoTitle'),description:t('onboarding.logoBody'),section:'settings' as const},
    {key:'staff' as const,label:t('onboarding.staffTitle'),description:t('onboarding.staffBody'),section:'administration' as const},
    {key:'news' as const,label:t('onboarding.newsTitle'),description:t('onboarding.newsBody'),section:'news' as const},
    {key:'activity' as const,label:t('onboarding.activityTitle'),description:t('onboarding.activityBody'),section:'activities' as const},
  ],[language]);

  const completed=items.filter(item=>state[item.key]).length;
  const done=completed===items.length;

  if(loading)return <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-sm opacity-60"><Loader2 className="animate-spin" size={18}/>{t('onboarding.checking')}</div></section>;

  if(done)return <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 text-emerald-600" size={22}/><div><h4 className="font-semibold text-emerald-950">{t('onboarding.doneTitle')}</h4><p className="mt-1 text-sm text-emerald-800">{t('onboarding.doneBody')}</p></div></div></section>;

  return <section className="rounded-3xl border bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{background:'color-mix(in srgb, var(--brand-primary) 12%, transparent)',color:'var(--brand-primary)'}}><Rocket size={19}/></div><div><h4 className="font-semibold">{t('onboarding.title')}</h4><p className="mt-1 text-xs opacity-60">{completed} {t('onboarding.progressOf')} {items.length} {t('onboarding.progressSteps')}</p></div></div>
      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{background:'color-mix(in srgb, var(--brand-primary) 10%, transparent)',color:'var(--brand-primary)'}}>{Math.round((completed/items.length)*100)}%</span>
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{width:`${(completed/items.length)*100}%`,background:'var(--brand-primary)'}}/></div>
    <div className="mt-4 space-y-2">{items.map(item=>{const complete=state[item.key];return <button key={item.key} type="button" disabled={complete} onClick={()=>onNavigate(item.section)} className="flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition enabled:hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-60">{complete?<CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18}/>:<Circle className="mt-0.5 shrink-0 opacity-35" size={18}/>}<div><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 text-xs opacity-55">{item.description}</p></div></button>;})}</div>
  </section>;
}
