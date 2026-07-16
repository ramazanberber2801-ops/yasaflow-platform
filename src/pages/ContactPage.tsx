import { useEffect, useState } from 'react';
import { Bell, BellOff, ChevronRight, Clock3, Globe2, Mail, MapPin, Navigation, Phone, User } from 'lucide-react';
import { ContactPersonModal } from '../components/ContactPersonModal';
import { useApp } from '../context/AppContext';
import { trackEvent } from '../lib/analytics';
import { useAppI18n } from '../lib/appI18n';
import { useOrganizationModules } from '../lib/moduleEngine';
import { getNotificationTranslations } from '../lib/notificationTranslations';
import { subscribeToPushNotifications } from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';
import type { StaffMember } from '../types';

const brand = { primary:'var(--brand-primary)', secondary:'var(--brand-secondary)', background:'var(--brand-background)', text:'var(--brand-text)', primaryText:'var(--brand-primary-text)', secondaryText:'var(--brand-secondary-text)' };
const mix=(color:string,amount:number,fallback='transparent')=>`color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

type PublicSettings={
  phone:string; email:string; address:string; website:string; opening_hours:string; map_url:string;
  publish_phone:boolean; publish_email:boolean; publish_address:boolean; publish_website:boolean; publish_opening_hours:boolean;
};

const emptyPublicSettings:PublicSettings={phone:'',email:'',address:'',website:'',opening_hours:'',map_url:'',publish_phone:false,publish_email:false,publish_address:false,publish_website:false,publish_opening_hours:false};

export function ContactPage(){
  const {staff}=useApp();
  const {t,direction,language}=useAppI18n();
  const {enabled:moduleEnabled}=useOrganizationModules('dtim');
  const pushEnabled=moduleEnabled('push',false);
  const [notificationsEnabled,setNotificationsEnabled]=useState(false);
  const [notificationLoading,setNotificationLoading]=useState(false);
  const [selectedMember,setSelectedMember]=useState<StaffMember|null>(null);
  const [publicSettings,setPublicSettings]=useState<PublicSettings>(emptyPublicSettings);
  const notificationText=getNotificationTranslations(language);

  useEffect(()=>{void trackEvent('contact_click','page',t('contact.title'));},[t]);
  useEffect(()=>{if(!pushEnabled)return;(async()=>{if(!('serviceWorker' in navigator))return;const registration=await navigator.serviceWorker.getRegistration('/sw.js');setNotificationsEnabled(Boolean(await registration?.pushManager.getSubscription()));})();},[pushEnabled]);
  useEffect(()=>{
    let cancelled=false;
    if(!supabase)return;
    supabase.from('organization_settings').select('phone,email,address,website,opening_hours,map_url,publish_phone,publish_email,publish_address,publish_website,publish_opening_hours').eq('organization_id','dtim').maybeSingle().then(({data,error})=>{
      if(cancelled)return;
      if(error){console.error('Kunne ikke hente offentlige innstillinger:',error.message);return;}
      if(data)setPublicSettings({...emptyPublicSettings,...data});
    });
    return()=>{cancelled=true;};
  },[]);

  const enableNotifications=async()=>{if(!pushEnabled)return;setNotificationLoading(true);setNotificationsEnabled(await subscribeToPushNotifications());setNotificationLoading(false);};
  const disableNotifications=async()=>{setNotificationLoading(true);try{const registration=await navigator.serviceWorker.getRegistration('/sw.js');const subscription=await registration?.pushManager.getSubscription();if(subscription){const endpoint=subscription.endpoint;await subscription.unsubscribe();await supabase?.from('push_subscriptions').delete().eq('endpoint',endpoint);}setNotificationsEnabled(false);alert(notificationText.disabledSuccess);}catch{alert(notificationText.disabledError);}finally{setNotificationLoading(false);}};
  const lightCardStyle={backgroundColor:'var(--brand-card)',color:'var(--brand-card-text)',borderColor:'var(--brand-border)'};
  const visibleItems=[
    publicSettings.publish_phone&&publicSettings.phone?{key:'phone',label:'Telefon',value:publicSettings.phone,href:`tel:${publicSettings.phone}`,icon:Phone}:null,
    publicSettings.publish_email&&publicSettings.email?{key:'email',label:'E-post',value:publicSettings.email,href:`mailto:${publicSettings.email}`,icon:Mail}:null,
    publicSettings.publish_website&&publicSettings.website?{key:'website',label:'Nettside',value:publicSettings.website,href:publicSettings.website.startsWith('http')?publicSettings.website:`https://${publicSettings.website}`,icon:Globe2}:null,
    publicSettings.publish_opening_hours&&publicSettings.opening_hours?{key:'opening',label:'Åpningstider',value:publicSettings.opening_hours,href:'',icon:Clock3}:null,
  ].filter(Boolean) as Array<{key:string;label:string;value:string;href:string;icon:typeof Phone}>;

  return <div className="min-h-screen pb-28" dir={direction} style={{backgroundColor:brand.background,color:brand.text}}>
    <section className="relative h-[32vh] min-h-[200px] overflow-hidden"><div className="absolute inset-0"><img src="/images/community.jpg" alt={t('contact.title')} className="h-full w-full object-cover"/><div className="absolute inset-0" style={{background:`linear-gradient(to bottom, ${mix(brand.secondary,40)}, ${mix(brand.secondary,80)})`}}/></div><div className="relative flex h-full flex-col items-center justify-center px-6 text-center" style={{color:brand.secondaryText}}><h1 className="font-serif text-2xl sm:text-3xl">{t('contact.title')}</h1><p className="mt-2 text-sm opacity-70">{t('contact.subtitle')}</p></div></section>

    {publicSettings.publish_address&&publicSettings.address&&<section className="relative z-10 -mt-8 px-4"><div className="overflow-hidden rounded-2xl border-2 shadow-lg" style={lightCardStyle}><div className="relative h-36 overflow-hidden"><img src="/images/map-banner.jpg" alt="" className="h-full w-full object-cover"/><div className="absolute inset-0" style={{background:`linear-gradient(to bottom, ${mix(brand.secondary,20)}, ${mix(brand.secondary,40)})`}}/><div className="absolute inset-0 flex items-center justify-center"><div className="theme-card flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg" style={{borderColor:mix(brand.primary,30)}}><MapPin size={26} style={{color:brand.primary}} fill="currentColor"/></div></div></div><div className="p-5"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{color:brand.primary}}>{t('contact.location')}</p><h3 className="mb-2 font-serif text-lg">{t('contact.address')}</h3><p className="whitespace-pre-line text-sm leading-relaxed opacity-60">{publicSettings.address}</p>{publicSettings.map_url&&<a href={publicSettings.map_url} target="_blank" rel="noopener noreferrer" onClick={()=>void trackEvent('contact_click','map',t('contact.directions'))} className="theme-secondary-panel mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-md"><Navigation size={17}/>{t('contact.directions')}</a>}</div></div></section>}

    {visibleItems.length>0&&<section className={`${publicSettings.publish_address&&publicSettings.address?'mt-5':'relative z-10 -mt-8'} px-4`}><div className="grid gap-3 sm:grid-cols-2">{visibleItems.map(({key,label,value,href,icon:Icon})=>href?<a key={key} href={href} target={key==='website'?'_blank':undefined} rel={key==='website'?'noopener noreferrer':undefined} className="flex items-start gap-3 rounded-2xl border-2 p-4 shadow-sm" style={lightCardStyle}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{backgroundColor:mix(brand.primary,12),color:brand.primary}}><Icon size={19}/></div><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider" style={{color:brand.primary}}>{label}</p><p className="mt-1 break-words whitespace-pre-line text-sm opacity-70">{value}</p></div></a>:<div key={key} className="flex items-start gap-3 rounded-2xl border-2 p-4 shadow-sm" style={lightCardStyle}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{backgroundColor:mix(brand.primary,12),color:brand.primary}}><Icon size={19}/></div><div><p className="text-[10px] font-semibold uppercase tracking-wider" style={{color:brand.primary}}>{label}</p><p className="mt-1 whitespace-pre-line text-sm opacity-70">{value}</p></div></div>)}</div></section>}

    {pushEnabled&&<section className="mt-5 px-4"><div className="rounded-xl border-2 p-5 shadow-md" style={{backgroundColor:brand.secondary,color:brand.secondaryText,borderColor:mix(brand.primary,28)}}><div className="mb-4 flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{backgroundColor:mix(brand.primary,18)}}>{notificationsEnabled?<Bell size={22} style={{color:brand.primary}}/>:<BellOff size={22} style={{color:brand.primary}}/>}</div><div><h2 className="font-serif text-lg">{notificationText.title}</h2><p className="mt-1 text-sm leading-6" style={{color:mix(brand.secondaryText,76)}}>{notificationText.description}</p></div></div><button onClick={notificationsEnabled?disableNotifications:enableNotifications} disabled={notificationLoading} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60" style={{backgroundColor:notificationsEnabled?mix(brand.secondaryText,12):brand.primary,color:notificationsEnabled?brand.secondaryText:brand.primaryText}}>{notificationsEnabled?<BellOff size={17}/>:<Bell size={17}/>} {notificationLoading?notificationText.processing:notificationsEnabled?notificationText.disableButton:notificationText.enableButton}</button></div></section>}

    <section className="mt-5 px-4"><div className="mb-3 flex items-center gap-2"><User size={18} style={{color:brand.primary}}/><h2 className="font-serif text-lg">{t('contact.staff')}</h2></div>{staff.length===0?<div className="rounded-xl border-2 p-8 text-center" style={lightCardStyle}><User size={32} className="mx-auto mb-2" style={{color:mix(brand.primary,40)}}/><p className="text-sm opacity-50">{t('contact.noStaff')}</p></div>:<div className="space-y-2.5">{staff.map(member=><button type="button" key={member.id} onClick={()=>setSelectedMember(member)} className="flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left shadow-sm transition active:scale-[0.99]" style={lightCardStyle}><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{background:`linear-gradient(135deg, ${brand.primary}, ${mix(brand.primary,80,'#000')})`,color:brand.primaryText}}>{member.name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><h3 className="truncate font-serif text-sm">{member.name}</h3>{member.position&&<p className="text-xs font-medium" style={{color:brand.primary}}>{member.position}</p>}{member.phone&&<p className="mt-1 flex items-center gap-1 text-xs opacity-50"><Phone size={11}/>{member.phone}</p>}</div><ChevronRight size={18} className="shrink-0 opacity-35"/></button>)}</div>}</section>

    <ContactPersonModal member={selectedMember} onClose={()=>setSelectedMember(null)}/>
  </div>;
}
