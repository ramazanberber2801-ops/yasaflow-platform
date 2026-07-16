import { useEffect, useMemo, useState } from 'react';
import { Activity, Building2, CalendarDays, Clock3, Heart, Loader2, Mail, MapPin, Newspaper, Phone, UserRound } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { useOrganizationModules } from '../lib/moduleEngine';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { getPublicOrganizationTranslation } from '../lib/publicOrganizationTranslations';
import { supabase } from '../lib/supabase';

type Settings = { display_name:string; short_name:string; address:string; map_url:string; phone:string; email:string; donation_number:string; donation_url:string; bank_account:string; iban:string; opening_hours:string; weekly_event:string; logo_url:string; app_icon_url:string };
type News = { id:string; title:string; summary:string; content:string; image_url:string|null; published_at:string|null };
type Event = { id:string; title:string; description:string; activity_date:string; start_time:string|null; location:string|null };
type Staff = { id:string; name:string; position:string|null; phone:string|null; email:string|null; image_url:string|null };

const emptySettings:Settings={display_name:'',short_name:'',address:'',map_url:'',phone:'',email:'',donation_number:'',donation_url:'',bank_account:'',iban:'',opening_hours:'',weekly_event:'',logo_url:'',app_icon_url:''};
const card='rounded-3xl border bg-white p-5 shadow-sm';

export function PublicOrganizationPage(){
  const {language,locale,direction}=useAppI18n();
  const t=(key:string)=>getPublicOrganizationTranslation(language,key);
  const {enabled,loading:modulesLoading}=useOrganizationModules(DEFAULT_ORGANIZATION_ID);
  const [settings,setSettings]=useState<Settings>(emptySettings);
  const [news,setNews]=useState<News[]>([]);
  const [events,setEvents]=useState<Event[]>([]);
  const [staff,setStaff]=useState<Staff[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      const client=supabase;if(!client){setLoading(false);return;}
      setLoading(true);setError('');
      const today=new Date().toISOString().slice(0,10);
      const [settingsResult,newsResult,eventResult,staffResult]=await Promise.all([
        client.from('organization_settings').select('display_name,short_name,address,map_url,phone,email,donation_number,donation_url,bank_account,iban,opening_hours,weekly_event,logo_url,app_icon_url').eq('organization_id',DEFAULT_ORGANIZATION_ID).maybeSingle(),
        client.from('organization_news').select('id,title,summary,content,image_url,published_at').eq('organization_id',DEFAULT_ORGANIZATION_ID).eq('status','published').eq('visibility','public').order('published_at',{ascending:false}).limit(6),
        client.from('organization_activities').select('id,title,description,activity_date,start_time,location').eq('organization_id',DEFAULT_ORGANIZATION_ID).eq('status','published').eq('visibility','public').gte('activity_date',today).order('activity_date').order('start_time').limit(6),
        client.from('organization_staff').select('id,name,position,phone,email,image_url').eq('organization_id',DEFAULT_ORGANIZATION_ID).eq('active',true).eq('public_visible',true).order('sort_order').limit(12),
      ]);
      if(cancelled)return;
      const firstError=settingsResult.error||newsResult.error||eventResult.error||staffResult.error;
      if(firstError)setError(firstError.message);
      setSettings({...emptySettings,...(settingsResult.data||{})});
      setNews((newsResult.data||[]) as News[]);setEvents((eventResult.data||[]) as Event[]);setStaff((staffResult.data||[]) as Staff[]);setLoading(false);
    };
    void load();return()=>{cancelled=true;};
  },[language]);

  const name=settings.display_name||settings.short_name||'Yasaflow';
  const logo=settings.logo_url||settings.app_icon_url;
  const donationVisible=enabled('donation',false)&&Boolean(settings.donation_number||settings.donation_url||settings.bank_account||settings.iban);
  const contactVisible=Boolean(settings.phone||settings.email||settings.address||settings.opening_hours||settings.weekly_event);
  const date=(value:string)=>new Date(`${value}T12:00:00`).toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric'});
  const phoneHref=useMemo(()=>settings.phone?`tel:${settings.phone.replace(/\s/g,'')}`:'',[settings.phone]);

  if(loading||modulesLoading)return <div className="flex min-h-screen items-center justify-center gap-2" dir={direction}><Loader2 className="animate-spin" size={20}/><span className="text-sm opacity-60">{t('public.loading')}</span></div>;

  return <div className="min-h-screen pb-28" dir={direction} style={{background:'var(--brand-background)',color:'var(--brand-text)'}}>
    <header className="border-b px-4 py-7" style={{background:'var(--brand-secondary)',color:'var(--brand-secondary-text)',borderColor:'var(--brand-border)'}}><div className="mx-auto flex max-w-4xl items-center gap-4">{logo?<img src={logo} alt="" className="h-20 w-20 rounded-3xl bg-white object-cover shadow-lg"/>:<div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10"><Building2 size={34}/></div>}<div className="min-w-0"><h1 className="font-serif text-3xl">{name}</h1>{settings.short_name&&settings.short_name!==name&&<p className="mt-1 text-sm opacity-70">{settings.short_name}</p>}{settings.address&&<p className="mt-3 flex items-center gap-2 text-xs opacity-65"><MapPin size={14}/>{settings.address}</p>}</div></div></header>
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-5">
      {error&&<p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{t('public.loadError')} {error}</p>}
      {contactVisible&&<section className={card}><h2 className="font-serif text-xl">{t('public.contact')}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{settings.phone&&<a href={phoneHref} className="flex items-center gap-3 rounded-2xl border p-4"><Phone size={18}/><span><span className="block text-xs opacity-50">{t('public.call')}</span><span className="text-sm font-semibold">{settings.phone}</span></span></a>}{settings.email&&<a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-2xl border p-4"><Mail size={18}/><span><span className="block text-xs opacity-50">{t('public.email')}</span><span className="text-sm font-semibold">{settings.email}</span></span></a>}{settings.address&&<a href={settings.map_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border p-4"><MapPin size={18}/><span><span className="block text-xs opacity-50">{t('public.map')}</span><span className="text-sm font-semibold">{settings.address}</span></span></a>}{settings.opening_hours&&<div className="flex items-center gap-3 rounded-2xl border p-4"><Clock3 size={18}/><span><span className="block text-xs opacity-50">{t('public.openingHours')}</span><span className="text-sm font-semibold">{settings.opening_hours}</span></span></div>}{settings.weekly_event&&<div className="rounded-2xl border p-4 sm:col-span-2"><p className="text-xs opacity-50">{t('public.weeklyEvent')}</p><p className="mt-1 text-sm font-semibold">{settings.weekly_event}</p></div>}</div></section>}

      {enabled('news',true)&&<section className={card}><div className="flex items-center gap-2"><Newspaper size={20}/><h2 className="font-serif text-xl">{t('public.news')}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{news.length===0?<p className="rounded-2xl border p-5 text-sm opacity-50 sm:col-span-2">{t('public.noNews')}</p>:news.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border">{item.image_url&&<img src={item.image_url} alt="" className="h-40 w-full object-cover"/>}<div className="p-4"><p className="text-[11px] opacity-45">{item.published_at?`${t('public.published')} ${new Date(item.published_at).toLocaleDateString(locale)}`:t('public.published')}</p><h3 className="mt-1 font-serif text-lg">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm opacity-65">{item.summary||item.content||t('public.noDescription')}</p></div></article>)}</div></section>}

      {enabled('activities',true)&&<section className={card}><div className="flex items-center gap-2"><Activity size={20}/><h2 className="font-serif text-xl">{t('public.activities')}</h2></div><div className="mt-4 space-y-3">{events.length===0?<p className="rounded-2xl border p-5 text-sm opacity-50">{t('public.noActivities')}</p>:events.map(item=><article key={item.id} className="flex gap-4 rounded-2xl border p-4"><div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}><CalendarDays size={17}/><span className="mt-1 text-[10px] font-semibold">{date(item.activity_date)}</span></div><div><h3 className="font-serif text-lg">{item.title}</h3><p className="mt-1 text-sm opacity-60">{item.description||t('public.noDescription')}</p><p className="mt-2 flex flex-wrap gap-3 text-xs opacity-50">{item.start_time&&<span className="flex items-center gap-1"><Clock3 size={12}/>{item.start_time.slice(0,5)}</span>}{item.location&&<span className="flex items-center gap-1"><MapPin size={12}/>{item.location}</span>}</p></div></article>)}</div></section>}

      {enabled('administration',true)&&<section className={card}><div className="flex items-center gap-2"><UserRound size={20}/><h2 className="font-serif text-xl">{t('public.team')}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{staff.length===0?<p className="rounded-2xl border p-5 text-sm opacity-50 sm:col-span-2">{t('public.noTeam')}</p>:staff.map(person=><article key={person.id} className="flex items-center gap-3 rounded-2xl border p-4">{person.image_url?<img src={person.image_url} alt="" className="h-12 w-12 rounded-full object-cover"/>:<div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5"><UserRound size={18}/></div>}<div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{person.name}</h3>{person.position&&<p className="truncate text-xs opacity-50">{person.position}</p>}<div className="mt-2 flex gap-2">{person.phone&&<a href={`tel:${person.phone.replace(/\s/g,'')}`} className="rounded-lg bg-black/5 px-2 py-1 text-[11px]">{t('public.call')}</a>}{person.email&&<a href={`mailto:${person.email}`} className="rounded-lg bg-black/5 px-2 py-1 text-[11px]">{t('public.email')}</a>}</div></div></article>)}</div></section>}

      {donationVisible&&<section className={card}><div className="flex items-center gap-2"><Heart size={20}/><h2 className="font-serif text-xl">{t('public.donate')}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{settings.donation_number&&<div className="rounded-2xl border p-4"><p className="text-xs opacity-50">{t('public.donateNumber')}</p><p className="mt-1 text-lg font-semibold">{settings.donation_number}</p></div>}{(settings.bank_account||settings.iban)&&<div className="rounded-2xl border p-4"><p className="text-xs opacity-50">{t('public.bankAccount')}</p><p className="mt-1 text-sm font-semibold">{settings.bank_account||settings.iban}</p></div>}{settings.donation_url&&<a href={settings.donation_url} target="_blank" rel="noreferrer" className="rounded-2xl px-4 py-3 text-center text-sm font-semibold sm:col-span-2" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{t('public.openDonation')}</a>}</div></section>}
    </main>
  </div>;
}
