import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, BellRing, Building2, Clock3, KeyRound, LayoutDashboard, Loader2, Newspaper, Settings, ShieldCheck, Users } from 'lucide-react';
import { AccessMembershipModule } from '../components/AccessMembershipModule';
import { ActivitiesModule } from '../components/ActivitiesModule';
import { ManualPushModule } from '../components/ManualPushModule';
import { MembersModule } from '../components/MembersModule';
import { NewsModule } from '../components/NewsModule';
import { OrganizationOnboardingChecklist } from '../components/OrganizationOnboardingChecklist';
import { OrganizationSettingsModule } from '../components/OrganizationSettingsModule';
import { OrganizationStaffModule } from '../components/OrganizationStaffModule';
import { useApp } from '../context/AppContext';
import { getAdminPortalTranslation } from '../lib/adminPortalTranslations';
import { useAppI18n } from '../lib/appI18n';
import { useOrganizationModules } from '../lib/moduleEngine';
import { resolveOrganizationAdminSession, type OrganizationAdminSession } from '../lib/organizationAdminSession';
import { supabase } from '../lib/supabase';

type PortalSection = 'dashboard' | 'members' | 'news' | 'activities' | 'notifications' | 'administration' | 'access' | 'settings';
type DashboardStats = { members:number; news:number; activities:number; staff:number };

const brand = { primary: 'var(--brand-primary)', background: 'var(--brand-background)', text: 'var(--brand-text)', card: 'var(--brand-card)' };
const mix = (color: string, amount: number, fallback = 'transparent') => `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;
const allSections = [
  { id: 'dashboard' as const, labelKey: 'adminPortal.nav.dashboard', icon: LayoutDashboard, moduleId: null },
  { id: 'members' as const, labelKey: 'adminPortal.nav.members', icon: Users, moduleId: 'members' },
  { id: 'news' as const, labelKey: 'adminPortal.nav.news', icon: Newspaper, moduleId: 'news' },
  { id: 'activities' as const, labelKey: 'adminPortal.nav.activities', icon: Activity, moduleId: 'activities' },
  { id: 'notifications' as const, labelKey: 'adminPortal.nav.notifications', icon: BellRing, moduleId: 'push' },
  { id: 'administration' as const, labelKey: 'adminPortal.nav.board', icon: ShieldCheck, moduleId: 'administration' },
  { id: 'access' as const, labelKey: 'adminPortal.nav.access', icon: KeyRound, moduleId: null },
  { id: 'settings' as const, labelKey: 'adminPortal.nav.settings', icon: Settings, moduleId: 'settings' },
];

function trialInfo(session: OrganizationAdminSession) {
  const status = session.subscriptionStatus || 'trial';
  const endsAt = session.trialEndsAt ? new Date(session.trialEndsAt) : null;
  const remainingMs = endsAt ? endsAt.getTime() - Date.now() : 0;
  const daysRemaining = endsAt ? Math.max(0, Math.ceil(remainingMs / 86400000)) : 0;
  const expired = ['expired', 'cancelled', 'past_due'].includes(status) || (status === 'trial' && Boolean(endsAt) && remainingMs <= 0);
  return { status, endsAt, daysRemaining, expired };
}

function Dashboard({ organizationId, organizationName, enabled, onNavigate, locked }:{ organizationId:string; organizationName:string; enabled:(moduleId:string,fallback?:boolean)=>boolean; onNavigate:(section:PortalSection)=>void; locked:boolean }){
  const { language } = useAppI18n();
  const t = (key: string) => getAdminPortalTranslation(language, key) || key;
  const [stats,setStats]=useState<DashboardStats>({members:0,news:0,activities:0,staff:0});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      if(!supabase){setLoading(false);return;}
      setLoading(true);setError('');
      const today=new Date().toISOString().slice(0,10);
      const [membersResult,newsResult,activitiesResult,staffResult]=await Promise.all([
        supabase.from('organization_memberships').select('*',{count:'exact',head:true}).eq('organization_id',organizationId),
        supabase.from('organization_news').select('*',{count:'exact',head:true}).eq('organization_id',organizationId),
        supabase.from('organization_activities').select('*',{count:'exact',head:true}).eq('organization_id',organizationId).gte('activity_date',today),
        supabase.from('organization_staff').select('*',{count:'exact',head:true}).eq('organization_id',organizationId).eq('active',true),
      ]);
      if(cancelled)return;
      const firstError=membersResult.error||newsResult.error||activitiesResult.error||staffResult.error;
      if(firstError)setError(firstError.message);
      setStats({members:membersResult.count||0,news:newsResult.count||0,activities:activitiesResult.count||0,staff:staffResult.count||0});
      setLoading(false);
    };
    void load();
    return()=>{cancelled=true;};
  },[organizationId]);

  const cards=[
    {id:'members' as const,label:t('adminPortal.dashboard.members'),value:stats.members,icon:Users,moduleId:'members'},
    {id:'news' as const,label:t('adminPortal.dashboard.news'),value:stats.news,icon:Newspaper,moduleId:'news'},
    {id:'activities' as const,label:t('adminPortal.dashboard.upcomingActivities'),value:stats.activities,icon:Activity,moduleId:'activities'},
    {id:'administration' as const,label:t('adminPortal.dashboard.activeBoardMembers'),value:stats.staff,icon:ShieldCheck,moduleId:'administration'},
  ].filter((item)=>enabled(item.moduleId,true));

  return <div className="space-y-4">
    <section className="rounded-3xl border p-5 shadow-sm" style={{backgroundColor:brand.card,borderColor:mix(brand.primary,16)}}><h3 className="font-serif text-xl">{t('adminPortal.dashboard.welcome')} {organizationName}</h3><p className="mt-2 text-sm opacity-65">{t('adminPortal.dashboard.overview')}</p></section>
    {!locked&&<OrganizationOnboardingChecklist organizationId={organizationId} onNavigate={onNavigate}/>} 
    {error&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{t('adminPortal.dashboard.statsError')} {error}</p>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({id,label,value,icon:Icon})=><button key={id} disabled={locked} onClick={()=>onNavigate(id)} className="rounded-2xl border p-4 text-left shadow-sm transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" style={{backgroundColor:brand.card,borderColor:mix(brand.primary,16)}}><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{backgroundColor:mix(brand.primary,12),color:brand.primary}}><Icon size={18}/></div>{loading?<Loader2 size={16} className="animate-spin opacity-50"/>:<span className="font-serif text-2xl">{value}</span>}</div><p className="mt-3 text-sm font-medium">{label}</p></button>)}</section>
    {!locked&&<section className="rounded-3xl border p-5 shadow-sm" style={{backgroundColor:brand.card,borderColor:mix(brand.primary,16)}}><h4 className="font-semibold">{t('adminPortal.dashboard.quickActions')}</h4><div className="mt-3 grid gap-2 sm:grid-cols-2">{enabled('news',true)&&<button onClick={()=>onNavigate('news')} className="rounded-xl border px-4 py-3 text-left text-sm" style={{borderColor:mix(brand.primary,16)}}>{t('adminPortal.dashboard.editNews')}</button>}{enabled('activities',true)&&<button onClick={()=>onNavigate('activities')} className="rounded-xl border px-4 py-3 text-left text-sm" style={{borderColor:mix(brand.primary,16)}}>{t('adminPortal.dashboard.editActivity')}</button>}<button onClick={()=>onNavigate('access')} className="rounded-xl border px-4 py-3 text-left text-sm" style={{borderColor:mix(brand.primary,16)}}>{t('adminPortal.dashboard.manageAccess')}</button>{enabled('settings',true)&&<button onClick={()=>onNavigate('settings')} className="rounded-xl border px-4 py-3 text-left text-sm" style={{borderColor:mix(brand.primary,16)}}>{t('adminPortal.dashboard.updateSettings')}</button>}</div></section>}
  </div>;
}

function PortalWithModules({ session, administratorName }: { session: OrganizationAdminSession; administratorName: string }) {
  const { language, locale } = useAppI18n();
  const t = (key: string) => getAdminPortalTranslation(language, key) || key;
  const [activeSection, setActiveSection] = useState<PortalSection>('dashboard');
  const { enabled, loading } = useOrganizationModules(session.organizationId);
  const trial = trialInfo(session);
  const pushEnabled = enabled('push', false);
  const sections = useMemo(() => allSections.filter((section) => {
    if (trial.expired && !['dashboard','settings'].includes(section.id)) return false;
    return !section.moduleId || enabled(section.moduleId, section.moduleId !== 'push');
  }), [enabled, trial.expired]);

  useEffect(() => { if (!sections.some((section) => section.id === activeSection)) setActiveSection('dashboard'); }, [sections, activeSection]);
  if (loading) return <div className="flex min-h-full items-center justify-center p-8"><Loader2 className="animate-spin" size={18} /></div>;

  return <div className="min-h-full" style={{ backgroundColor: brand.background, color: brand.text }}>
    <section className="border-b px-4 py-5 sm:px-6" style={{ borderColor: mix(brand.primary, 16) }}><div className="mx-auto flex max-w-6xl items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>{session.organizationLogoUrl ? <img src={session.organizationLogoUrl} alt="" className="h-full w-full object-cover" /> : <Building2 size={22} />}</div><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-[0.18em] opacity-45">{t('adminPortal.title')}</p><h2 className="truncate font-serif text-xl sm:text-2xl">{session.organizationName}</h2><p className="mt-0.5 text-xs opacity-55">{t('adminPortal.signedInAs')} {administratorName}{session.organizationStatus ? ` · ${session.organizationStatus}` : ''}</p></div></div></section>
    {trial.status==='trial'&&!trial.expired&&<div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6"><div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900"><Clock3 size={19} className="mt-0.5 shrink-0"/><div><p className="text-sm font-semibold">{t('adminPortal.trial.title')}</p><p className="mt-1 text-xs leading-5">{trial.daysRemaining} {trial.daysRemaining===1?t('adminPortal.trial.day'):t('adminPortal.trial.days')} {t('adminPortal.trial.remaining')}{trial.endsAt?` · ${t('adminPortal.trial.expires')} ${trial.endsAt.toLocaleDateString(locale)}`:''}. {t('adminPortal.trial.noCharge')}</p></div></div></div>}
    {trial.expired&&<div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6"><div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><AlertCircle size={19} className="mt-0.5 shrink-0"/><div><p className="text-sm font-semibold">{t('adminPortal.trial.expiredTitle')}</p><p className="mt-1 text-xs leading-5">{t('adminPortal.trial.expiredBody')}</p></div></div></div>}
    <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="grid grid-cols-4 gap-2 rounded-2xl border bg-white p-2 shadow-sm sm:grid-cols-8 lg:flex lg:flex-col" style={{ borderColor: mix(brand.primary, 16) }}>{sections.map(({id,labelKey,icon:Icon})=>{const active=activeSection===id;return <button key={id} onClick={()=>setActiveSection(id)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-xs" style={{backgroundColor:active?mix(brand.primary,12):'transparent',color:active?brand.primary:brand.text}}><Icon size={17}/><span>{t(labelKey)}</span></button>;})}</nav>
      <main>{activeSection==='dashboard'?<Dashboard organizationId={session.organizationId} organizationName={session.organizationName} enabled={enabled} onNavigate={setActiveSection} locked={trial.expired}/>:activeSection==='members'?<MembersModule organizationId={session.organizationId}/>:activeSection==='news'?<NewsModule organizationId={session.organizationId} pushEnabled={pushEnabled}/>:activeSection==='activities'?<ActivitiesModule organizationId={session.organizationId}/>:activeSection==='notifications'&&pushEnabled?<ManualPushModule organizationId={session.organizationId}/>:activeSection==='administration'?<OrganizationStaffModule organizationId={session.organizationId}/>:activeSection==='access'?<AccessMembershipModule organizationId={session.organizationId}/>:<OrganizationSettingsModule organizationId={session.organizationId}/>}</main>
    </div>
  </div>;
}

export function OrganizationAdminPortal() {
  const { language } = useAppI18n();
  const t = (key: string) => getAdminPortalTranslation(language, key) || key;
  const { currentAdmin } = useApp();
  const [session, setSession] = useState<OrganizationAdminSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => { let cancelled = false; resolveOrganizationAdminSession().then((resolved) => { if (!cancelled) setSession(resolved); }).catch((error) => { if (!cancelled) setSessionError(error instanceof Error ? error.message : getAdminPortalTranslation(language, 'adminPortal.loadOrganizationError') || ''); }).finally(() => { if (!cancelled) setSessionLoading(false); }); return () => { cancelled = true; }; }, [language]);

  const administratorName = session?.adminDisplayName || currentAdmin?.displayName || currentAdmin?.display_name || currentAdmin?.username || t('adminPortal.administrator');
  if (sessionLoading) return <div className="flex min-h-full items-center justify-center p-8" style={{ backgroundColor: brand.background, color: brand.text }}><div className="flex items-center gap-3 text-sm opacity-65"><Loader2 className="animate-spin" size={18} /> {t('adminPortal.loadingOrganization')}</div></div>;
  if (!session) return <div className="flex min-h-full items-center justify-center p-4" style={{ backgroundColor: brand.background, color: brand.text }}><section className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: mix(brand.primary, 18) }}><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertCircle size={20} /></div><div><h2 className="font-serif text-xl">{t('adminPortal.noOrganization')}</h2><p className="mt-2 text-sm leading-6 opacity-65">{sessionError}</p></div></div></section></div>;
  return <PortalWithModules session={session} administratorName={administratorName} />;
}
