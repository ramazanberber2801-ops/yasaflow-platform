import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock3, Facebook, Globe2, Heart, Instagram, Loader2, Mail, MapPin, Music2, Newspaper, Phone, Share2, UserRound, X, Youtube } from 'lucide-react';
import { PublicActivitiesCalendar } from '../components/PublicActivitiesCalendar';
import { useAppI18n } from '../lib/appI18n';
import { useOrganizationModules } from '../lib/moduleEngine';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { getPublicOrganizationTranslation } from '../lib/publicOrganizationTranslations';
import { supabase } from '../lib/supabase';

type Settings = {
  display_name:string; short_name:string; description:string; banner_url:string; address:string; map_url:string; phone:string; email:string; website:string;
  facebook_url:string; instagram_url:string; youtube_url:string; tiktok_url:string;
  donation_number:string; donation_url:string; bank_account:string; iban:string; opening_hours:string; weekly_event:string; logo_url:string; app_icon_url:string;
  publish_phone:boolean; publish_email:boolean; publish_address:boolean; publish_website:boolean; publish_opening_hours:boolean;
};
type News = { id:string; title:string; summary:string; content:string; image_url:string|null; published_at:string|null };
type Staff = { id:string; name:string; position:string|null; phone:string|null; email:string|null; image_url:string|null };

const emptySettings:Settings={display_name:'',short_name:'',description:'',banner_url:'',address:'',map_url:'',phone:'',email:'',website:'',facebook_url:'',instagram_url:'',youtube_url:'',tiktok_url:'',donation_number:'',donation_url:'',bank_account:'',iban:'',opening_hours:'',weekly_event:'',logo_url:'',app_icon_url:'',publish_phone:false,publish_email:false,publish_address:false,publish_website:false,publish_opening_hours:false};
const card='rounded-3xl border bg-white p-5 shadow-sm';

export function PublicOrganizationPage(){
  const {language,locale,direction}=useAppI18n();
  const t=(key:string)=>getPublicOrganizationTranslation(language,key);
  const {enabled,loading:modulesLoading}=useOrganizationModules(DEFAULT_ORGANIZATION_ID);
  const [settings,setSettings]=useState<Settings>(emptySettings);
  const [news,setNews]=useState<News[]>([]);
  const [staff,setStaff]=useState<Staff[]>([]);
  const [selectedNews,setSelectedNews]=useState<News|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      const client=supabase;if(!client){setLoading(false);return;}
      setLoading(true);setError('');
      const [settingsResult,newsResult,staffResult]=await Promise.all([
        client.from('organization_settings').select('display_name,short_name,description,banner_url,address,map_url,phone,email,website,facebook_url,instagram_url,youtube_url,tiktok_url,donation_number,donation_url,bank_account,iban,opening_hours,weekly_event,logo_url,app_icon_url,publish_phone,publish_email,publish_address,publish_website,publish_opening_hours').eq('organization_id',DEFAULT_ORGANIZATION_ID).maybeSingle(),
        client.from('organization_news').select('id,title,summary,content,image_url,published_at').eq('organization_id',DEFAULT_ORGANIZATION_ID).eq('status','published').eq('visibility','public').order('published_at',{ascending:false}).limit(6),
        client.from('organization_staff').select('id,name,position,phone,email,image_url').eq('organization_id',DEFAULT_ORGANIZATION_ID).eq('active',true).eq('public_visible',true).order('sort_order').limit(12),
      ]);
      if(cancelled)return;
      const firstError=settingsResult.error||newsResult.error||staffResult.error;
      if(firstError)setError(firstError.message);
      setSettings({...emptySettings,...(settingsResult.data||{})});
      const loadedNews=(newsResult.data||[]) as News[];setNews(loadedNews);setStaff((staffResult.data||[]) as Staff[]);setLoading(false);
      const requestedNews=new URLSearchParams(window.location.search).get('news');
      if(requestedNews)setSelectedNews(loadedNews.find(item=>item.id===requestedNews)||null);
    };
    void load();return()=>{cancelled=true;};
  },[language]);

  const name=settings.display_name||settings.short_name||'Yasaflow';
  const logo=settings.logo_url||settings.app_icon_url;
  const donationVisible=enabled('donation',false)&&Boolean(settings.donation_number||settings.donation_url||settings.bank_account||settings.iban);
  const contactVisible=Boolean((settings.publish_phone&&settings.phone)||(settings.publish_email&&settings.email)||(settings.publish_address&&settings.address)||(settings.publish_opening_hours&&settings.opening_hours)||settings.weekly_event||(settings.publish_website&&settings.website));
  const socialLinks=[
    settings.publish_website&&settings.website?{label:t('public.website'),url:settings.website,icon:Globe2}:null,
    settings.facebook_url?{label:'Facebook',url:settings.facebook_url,icon:Facebook}:null,
    settings.instagram_url?{label:'Instagram',url:settings.instagram_url,icon:Instagram}:null,
    settings.youtube_url?{label:'YouTube',url:settings.youtube_url,icon:Youtube}:null,
    settings.tiktok_url?{label:'TikTok',url:settings.tiktok_url,icon:Music2}:null,
  ].filter(Boolean) as Array<{label:string;url:string;icon:typeof Globe2}>;
  const phoneHref=useMemo(()=>settings.phone?`tel:${settings.phone.replace(/\s/g,'')}`:'',[settings.phone]);
  const shareNews=async(item:News)=>{const url=new URL(window.location.href);url.searchParams.set('news',item.id);try{if(navigator.share)await navigator.share({title:item.title,text:item.summary||item.content||'',url:url.toString()});else{await navigator.clipboard.writeText(url.toString());setMessage(t('public.shared'));}}catch(shareError){if((shareError as Error)?.name!=='AbortError')setError(t('public.shareFailed'));}};
  const closeNews=()=>{setSelectedNews(null);const url=new URL(window.location.href);url.searchParams.delete('news');window.history.replaceState({},'',url.toString());};

  if(loading||modulesLoading)return <div className="flex min-h-screen items-center justify-center gap-2" dir={direction}><Loader2 className="animate-spin" size={20}/><span className="text-sm opacity-60">{t('public.loading')}</span></div>;

  return <div className="min-h-screen pb-28" dir={direction} style={{background:'var(--brand-background)',color:'var(--brand-text)'}}>
    <header className="relative overflow-hidden border-b" style={{background:'var(--brand-secondary)',color:'var(--brand-secondary-text)',borderColor:'var(--brand-border)'}}>
      {settings.banner_url&&<img src={settings.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"/><div className="relative mx-auto flex min-h-64 max-w-4xl items-end gap-4 px-4 py-8">{logo?<img src={logo} alt="" className="h-24 w-24 rounded-3xl bg-white object-cover shadow-xl"/>:<div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur"><Building2 size={38}/></div>}<div className="min-w-0"><h1 className="font-serif text-3xl sm:text-4xl">{name}</h1>{settings.short_name&&settings.short_name!==name&&<p className="mt-1 text-sm opacity-75">{settings.short_name}</p>}{settings.publish_address&&settings.address&&<p className="mt-3 flex items-center gap-2 text-xs opacity-75"><MapPin size={14}/>{settings.address}</p>}</div></div>
    </header>
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-5">
      {error&&<p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{t('public.loadError')} {error}</p>}{message&&<p className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {settings.description&&<section className={card}><h2 className="font-serif text-xl">{t('public.about')}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 opacity-70">{settings.description}</p></section>}
      {socialLinks.length>0&&<section className={card}><h2 className="font-serif text-xl">{t('public.follow')}</h2><div className="mt-4 flex flex-wrap gap-2">{socialLinks.map(({label,url,icon:Icon})=><a key={label} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Icon size={16}/>{label}</a>)}</div></section>}
      {contactVisible&&<section className={card}><h2 className="font-serif text-xl">{t('public.contact')}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{settings.publish_phone&&settings.phone&&<a href={phoneHref} className="flex items-center gap-3 rounded-2xl border p-4"><Phone size={18}/><span><span className="block text-xs opacity-50">{t('public.call')}</span><span className="text-sm font-semibold">{settings.phone}</span></span></a>}{settings.publish_email&&settings.email&&<a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-2xl border p-4"><Mail size={18}/><span><span className="block text-xs opacity-50">{t('public.email')}</span><span className="text-sm font-semibold">{settings.email}</span></span></a>}{settings.publish_address&&settings.address&&<a href={settings.map_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border p-4"><MapPin size={18}/><span><span className="block text-xs opacity-50">{t('public.map')}</span><span className="text-sm font-semibold">{settings.address}</span></span></a>}{settings.publish_opening_hours&&settings.opening_hours&&<div className="flex items-center gap-3 rounded-2xl border p-4"><Clock3 size={18}/><span><span className="block text-xs opacity-50">{t('public.openingHours')}</span><span className="text-sm font-semibold">{settings.opening_hours}</span></span></div>}{settings.publish_website&&settings.website&&<a href={settings.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border p-4"><Globe2 size={18}/><span><span className="block text-xs opacity-50">{t('public.website')}</span><span className="text-sm font-semibold">{settings.website}</span></span></a>}{settings.weekly_event&&<div className="rounded-2xl border p-4 sm:col-span-2"><p className="text-xs opacity-50">{t('public.weeklyEvent')}</p><p className="mt-1 text-sm font-semibold">{settings.weekly_event}</p></div>}</div></section>}
      {enabled('news',true)&&<section className={card}><div className="flex items-center gap-2"><Newspaper size={20}/><h2 className="font-serif text-xl">{t('public.news')}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{news.length===0?<p className="rounded-2xl border p-5 text-sm opacity-50 sm:col-span-2">{t('public.noNews')}</p>:news.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border">{item.image_url&&<button type="button" onClick={()=>setSelectedNews(item)} className="block w-full"><img src={item.image_url} alt="" className="h-40 w-full object-cover"/></button>}<div className="p-4"><p className="text-[11px] opacity-45">{item.published_at?`${t('public.published')} ${new Date(item.published_at).toLocaleDateString(locale)}`:t('public.published')}</p><h3 className="mt-1 font-serif text-lg">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm opacity-65">{item.summary||item.content||t('public.noDescription')}</p><button type="button" onClick={()=>setSelectedNews(item)} className="mt-3 text-sm font-semibold" style={{color:'var(--brand-primary)'}}>{t('public.readMore')}</button></div></article>)}</div></section>}
      {enabled('activities',true)&&<PublicActivitiesCalendar organizationId={DEFAULT_ORGANIZATION_ID} locale={locale}/>} 
      {enabled('administration',true)&&<section className={card}><div className="flex items-center gap-2"><UserRound size={20}/><h2 className="font-serif text-xl">{t('public.team')}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{staff.length===0?<p className="rounded-2xl border p-5 text-sm opacity-50 sm:col-span-2">{t('public.noTeam')}</p>:staff.map(person=><article key={person.id} className="flex items-center gap-3 rounded-2xl border p-4">{person.image_url?<img src={person.image_url} alt="" className="h-12 w-12 rounded-full object-cover"/>:<div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5"><UserRound size={18}/></div>}<div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{person.name}</h3>{person.position&&<p className="truncate text-xs opacity-50">{person.position}</p>}<div className="mt-2 flex gap-2">{person.phone&&<a href={`tel:${person.phone.replace(/\s/g,'')}`} className="rounded-lg bg-black/5 px-2 py-1 text-[11px]">{t('public.call')}</a>}{person.email&&<a href={`mailto:${person.email}`} className="rounded-lg bg-black/5 px-2 py-1 text-[11px]">{t('public.email')}</a>}</div></div></article>)}</div></section>}
      {donationVisible&&<section className={card}><div className="flex items-center gap-2"><Heart size={20}/><h2 className="font-serif text-xl">{t('public.donate')}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{settings.donation_number&&<div className="rounded-2xl border p-4"><p className="text-xs opacity-50">{t('public.donateNumber')}</p><p className="mt-1 text-lg font-semibold">{settings.donation_number}</p></div>}{(settings.bank_account||settings.iban)&&<div className="rounded-2xl border p-4"><p className="text-xs opacity-50">{t('public.bankAccount')}</p><p className="mt-1 text-sm font-semibold">{settings.bank_account||settings.iban}</p></div>}{settings.donation_url&&<a href={settings.donation_url} target="_blank" rel="noreferrer" className="rounded-2xl px-4 py-3 text-center text-sm font-semibold sm:col-span-2" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{t('public.openDonation')}</a>}</div></section>}
    </main>
    {selectedNews&&<div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><article className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl">{selectedNews.image_url&&<img src={selectedNews.image_url} alt="" className="max-h-80 w-full object-cover"/>}<div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs opacity-45">{selectedNews.published_at?`${t('public.published')} ${new Date(selectedNews.published_at).toLocaleDateString(locale)}`:t('public.published')}</p><h2 className="mt-1 font-serif text-3xl">{selectedNews.title}</h2></div><button aria-label={t('public.close')} onClick={closeNews} className="rounded-full bg-black/5 p-2"><X size={18}/></button></div>{selectedNews.summary&&<p className="mt-4 text-base font-medium leading-7 opacity-75">{selectedNews.summary}</p>}<p className="mt-4 whitespace-pre-wrap text-sm leading-7 opacity-75">{selectedNews.content||selectedNews.summary||t('public.noDescription')}</p><button onClick={()=>void shareNews(selectedNews)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold"><Share2 size={16}/>{t('public.share')}</button></div></article></div>}
  </div>;
}
