import { useEffect, useState } from 'react';
import { BookOpen, Calendar, ChevronRight, Clock, CloudSun, Crosshair, Loader2, MapPin, Mic, Moon, Newspaper, Search, Sun, Sunrise, Sunset, User } from 'lucide-react';
import { InstallAppButton } from '../components/InstallAppButton';
import { NewsModal } from '../components/NewsModal';
import { SohbetModal } from '../components/SohbetModal';
import { useApp } from '../context/AppContext';
import { trackEvent } from '../lib/analytics';
import { useAppI18n } from '../lib/appI18n';
import { useOrganizationModules } from '../lib/moduleEngine';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { getNextPrayer, getTimeUntil } from '../lib/prayerTimes';
import { supabase } from '../lib/supabase';
import { useClock } from '../lib/useClock';
import { useLocation } from '../lib/useLocation';
import type { NewsItem, SohbetItem } from '../types';

type NewsWithDbImage = NewsItem & { image_base64?: string; image_base_64?: string; imageBase64?: string };
type SohbetWithDbImage = SohbetItem & { image_base_64?: string; image_base64?: string; imageBase64?: string };
type DailyData = { verse_text?: string; verse_reference?: string; hadith_text?: string; hadith_source?: string };

const brand = { primary:'var(--brand-primary)', secondary:'var(--brand-secondary)', background:'var(--brand-background)', text:'var(--brand-text)', primaryText:'var(--brand-primary-text)', secondaryText:'var(--brand-secondary-text)' };
const mix=(color:string,amount:number,fallback='transparent')=>`color-mix(in srgb, ${color} ${amount}%, ${fallback})`;
const parseLocalDate=(dateString:string)=>{const [year,month,day]=dateString.split('-').map(Number);return new Date(year,month-1,day);};

export function HomePage(){
  const {news,sohbet,settings}=useApp();
  const {t,locale,direction}=useAppI18n();
  const {enabled,loading:modulesLoading}=useOrganizationModules(DEFAULT_ORGANIZATION_ID);
  const now=useClock();
  const {city,isAuto,loading,prayerData,showSelector,setShowSelector,searchQuery,searchResults,searching,handleSearch,selectCity,resetToAuto}=useLocation();
  const [dailyData,setDailyData]=useState<DailyData|null>(null);
  const [selectedNews,setSelectedNews]=useState<NewsWithDbImage|null>(null);
  const [selectedSohbet,setSelectedSohbet]=useState<SohbetWithDbImage|null>(null);

  const prayerEnabled=enabled('prayer',false);
  const ramadanEnabled=enabled('ramadan',false);
  const kurbanEnabled=enabled('kurban',false);
  const dailyInspirationEnabled=enabled('daily_inspiration',false);
  const activitiesEnabled=enabled('activities',true);
  const newsEnabled=enabled('news',true);

  useEffect(()=>{void trackEvent('app_open');},[]);
  useEffect(()=>{
    const client=supabase;
    if(!dailyInspirationEnabled||!client){setDailyData(null);return;}
    let cancelled=false;
    const load=async()=>{
      const start=new Date(new Date().getFullYear(),0,0);
      const dayOfYear=Math.floor((Date.now()-start.getTime())/86400000);
      const {data,error}=await client.from('inspiration').select('verse_text, verse_reference, hadith_text, hadith_source').eq('day_of_year',dayOfYear).maybeSingle();
      if(!cancelled&&!error)setDailyData(data||null);
    };
    void load();
    return()=>{cancelled=true;};
  },[dailyInspirationEnabled,now.getDate()]);

  const nextPrayer=prayerData?getNextPrayer(prayerData.timings,prayerData.timezone):null;
  const timeUntil=nextPrayer?getTimeUntil(nextPrayer.time,prayerData?.timezone):null;
  const prayerItems=prayerData?[
    {name:'Imsak',time:prayerData.timings.Fajr,icon:Sunrise},
    {name:'Güneş',time:prayerData.timings.Sunrise,icon:Sun},
    {name:'Öğle',time:prayerData.timings.Dhuhr,icon:CloudSun},
    {name:'İkindi',time:prayerData.timings.Asr,icon:Sun},
    {name:'Akşam',time:prayerData.timings.Maghrib,icon:Sunset},
    {name:'Yatsı',time:prayerData.timings.Isha,icon:Moon},
  ]:[];

  const featuredNews=(news||[]).slice(0,6) as NewsWithDbImage[];
  const upcomingActivities=(sohbet||[]).slice(0,4) as SohbetWithDbImage[];
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const todayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const todayActivities=(sohbet||[]).filter((item:any)=>item.date===todayKey);
  const ramadanStart=settings?.ramadanStartDate?parseLocalDate(settings.ramadanStartDate):null;
  const ramadanEnd=settings?.ramadanEndDate?parseLocalDate(settings.ramadanEndDate):null;
  const ramadanDay=ramadanStart?Math.floor((today.getTime()-ramadanStart.getTime())/86400000)+1:null;
  const showRamadan=Boolean(ramadanEnabled&&settings?.ramadanEnabled&&ramadanStart&&ramadanEnd&&today>=ramadanStart&&today<=ramadanEnd&&prayerData);
  const bayramDate=ramadanEnd?new Date(ramadanEnd.getFullYear(),ramadanEnd.getMonth(),ramadanEnd.getDate()+1):null;
  const showBayram=Boolean(ramadanEnabled&&settings?.ramadanEnabled&&bayramDate&&today.getTime()===bayramDate.getTime());
  const kurbanStart=settings?.kurbanStartDate?parseLocalDate(settings.kurbanStartDate):null;
  const kurbanDay=kurbanStart?Math.floor((today.getTime()-kurbanStart.getTime())/86400000)+1:null;
  const showKurban=Boolean(kurbanEnabled&&settings?.kurbanEnabled&&kurbanDay&&kurbanDay>=1&&kurbanDay<=4);
  const cardStyle={backgroundColor:'var(--brand-card)',color:brand.text,borderColor:mix(brand.primary,18)};
  const darkCardStyle={backgroundColor:brand.secondary,color:brand.secondaryText,borderColor:mix(brand.primary,28)};
  const openActivity=(item:SohbetWithDbImage)=>{void trackEvent('activity_open',item.id,item.title);setSelectedSohbet(item);};

  return <div className="min-h-screen pb-28" dir={direction} style={{backgroundColor:brand.background,color:brand.text}}>
    <header className="sticky top-0 z-30 shadow-md" style={{backgroundColor:brand.secondary,color:brand.secondaryText}}><div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-3">{settings?.brandingLogoUrl?<img src={settings.brandingLogoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover"/>:<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold" style={{backgroundColor:brand.primary,color:brand.primaryText}}>Y</div>}<div className="min-w-0"><h1 className="truncate font-serif text-base leading-tight">{settings?.mosqueName||'Yasaflow'}</h1><p className="text-[10px] uppercase tracking-wider" style={{color:brand.primary}}>{settings?.shortName||'Organisasjonsplattform'}</p></div></div></header>

    {!modulesLoading&&prayerEnabled&&<section className="px-4 pt-4"><div className="overflow-hidden rounded-xl border-2 shadow-md" style={cardStyle}><div className="relative flex items-center justify-between px-4 py-2.5" style={{backgroundColor:brand.secondary,color:brand.secondaryText}}><div className="flex min-w-0 items-center gap-1.5">{isAuto?<Crosshair size={13} style={{color:brand.primary}}/>:<MapPin size={13} style={{color:brand.primary}}/>}<span className="max-w-[145px] truncate text-xs font-medium">{city.name}{city.country?`, ${city.country}`:''}</span></div><button onClick={()=>setShowSelector(!showSelector)} className="text-[10px]" style={{color:brand.primary}}>{t('home.changeCity')}</button>{showSelector&&<div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-b-xl border-2 border-t-0 p-3 shadow-2xl" style={{backgroundColor:brand.background,borderColor:mix(brand.primary,28)}}><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30"/><input value={searchQuery} onChange={e=>handleSearch(e.target.value)} placeholder={t('home.searchCity')} className="w-full rounded-lg border bg-white py-2.5 pl-9 pr-9 text-sm"/>{searching&&<Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"/>}</div><div className="mt-2 max-h-52 overflow-y-auto">{searchResults.map(result=><button key={result.id} onClick={()=>selectCity(result)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-black/5"><MapPin size={13}/><span className="text-xs">{result.name}{result.country?`, ${result.country}`:''}</span></button>)}</div><button onClick={resetToAuto} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-black/5"><Crosshair size={14}/>{t('home.useLocation')}</button></div>}</div>{nextPrayer&&<div className="flex items-center justify-between border-b px-4 py-2" style={{backgroundColor:mix(brand.primary,9),borderColor:mix(brand.primary,16)}}><span className="flex items-center gap-1.5 text-[11px]"><Clock size={13}/>{t('home.nextPrayer')}: <strong>{nextPrayer.name}</strong></span><span className="text-[11px] font-semibold">{nextPrayer.time} · {timeUntil}</span></div>}<div className="grid grid-cols-3 gap-1.5 p-2.5">{loading?<p className="col-span-3 py-4 text-center text-xs opacity-50">{t('home.loadingPrayer')}</p>:prayerItems.map(({name,time,icon:Icon})=><div key={name} className="rounded-lg border-2 p-2 text-center" style={{backgroundColor:brand.background,borderColor:mix(brand.primary,18)}}><Icon size={14} className="mx-auto mb-1" style={{color:brand.primary}}/><p className="text-[10px] opacity-60">{name}</p><p className="text-xs font-semibold">{time}</p></div>)}</div></div></section>}

    <InstallAppButton/>
    {showRamadan&&<section className="px-4 pt-4"><div className="rounded-xl border-2 p-5" style={darkCardStyle}><h2 className="font-serif text-lg" style={{color:brand.primary}}>RAMADAN</h2><p className="mt-2 text-sm">Dag {ramadanDay}</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border p-4 text-center" style={{borderColor:mix(brand.primary,22)}}><p className="text-xs opacity-60">Imsak</p><p className="font-semibold">{prayerData?.timings.Fajr}</p></div><div className="rounded-xl border p-4 text-center" style={{borderColor:mix(brand.primary,22)}}><p className="text-xs opacity-60">Iftar</p><p className="font-semibold">{prayerData?.timings.Maghrib}</p></div></div></div></section>}
    {showBayram&&<section className="px-4 pt-4"><div className="rounded-xl border-2 p-6 text-center" style={darkCardStyle}><h2 className="font-serif text-xl" style={{color:brand.primary}}>EID MUBARAK</h2></div></section>}
    {showKurban&&<section className="px-4 pt-4"><div className="rounded-xl border-2 p-6 text-center" style={darkCardStyle}><h2 className="font-serif text-xl" style={{color:brand.primary}}>EID AL-ADHA</h2><p className="mt-2 text-sm">Dag {kurbanDay}</p>{todayActivities[0]&&<button onClick={()=>openActivity(todayActivities[0])} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium" style={{backgroundColor:brand.primary,color:brand.primaryText}}><Calendar size={17}/>{t('home.todayProgram')}<ChevronRight size={17}/></button>}</div></section>}

    {!modulesLoading&&dailyInspirationEnabled&&dailyData&&<section className="px-4 pt-4"><div className="rounded-xl p-5" style={darkCardStyle}>{dailyData.verse_text&&<div><div className="mb-2 flex items-center gap-2"><BookOpen size={14} style={{color:brand.primary}}/><h3 className="text-[11px] font-bold uppercase" style={{color:brand.primary}}>Dagens vers</h3></div><p className="text-sm">{dailyData.verse_text}</p>{dailyData.verse_reference&&<p className="mt-1 text-[10px] opacity-50">{dailyData.verse_reference}</p>}</div>}{dailyData.hadith_text&&<div className={dailyData.verse_text?'mt-5':''}><div className="mb-2 flex items-center gap-2"><BookOpen size={14} style={{color:brand.primary}}/><h3 className="text-[11px] font-bold uppercase" style={{color:brand.primary}}>Dagens hadith</h3></div><p className="text-sm">{dailyData.hadith_text}</p>{dailyData.hadith_source&&<p className="mt-1 text-[10px] opacity-50">{dailyData.hadith_source}</p>}</div>}</div></section>}

    {!modulesLoading&&activitiesEnabled&&<section className="px-4 pt-5"><div className="mb-2 flex items-center gap-2"><Mic size={18} style={{color:brand.primary}}/><h2 className="font-serif text-lg">{t('home.upcomingActivities')}</h2></div><div className="space-y-2.5">{upcomingActivities.length===0?<div className="rounded-xl border p-5 text-center text-sm opacity-50" style={cardStyle}>{t('home.noUpcomingActivities')}</div>:upcomingActivities.map(item=><button key={item.id} onClick={()=>openActivity(item)} className="flex w-full overflow-hidden rounded-xl border text-left" style={cardStyle}><div className="flex w-16 shrink-0 flex-col items-center justify-center py-3" style={{backgroundColor:brand.secondary,color:brand.secondaryText}}><span className="text-[10px]" style={{color:brand.primary}}>{new Date(item.date).toLocaleDateString(locale,{month:'short'})}</span><span className="font-serif text-xl">{new Date(item.date).getDate()}</span><span className="text-[10px] opacity-60">{item.time}</span></div><div className="min-w-0 flex-1 p-3"><h3 className="truncate font-serif text-sm">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs opacity-50">{item.description}</p><div className="mt-1.5 flex gap-3 text-[10px] opacity-40"><span className="flex items-center gap-1"><MapPin size={10}/>{item.location}</span>{item.speaker&&<span className="flex items-center gap-1"><User size={10}/>{item.speaker}</span>}</div></div></button>)}</div></section>}

    {!modulesLoading&&newsEnabled&&<section className="px-4 pt-5"><div className="mb-3 flex items-center gap-2"><Newspaper size={18} style={{color:brand.primary}}/><h2 className="font-serif text-lg">{t('home.news')}</h2></div><div className="space-y-2.5">{featuredNews.length===0?<div className="rounded-xl border p-6 text-center text-sm opacity-50" style={cardStyle}>{t('home.noNews')}</div>:featuredNews.map(item=>{const image=item.imageBase64||item.image_base_64||item.image_base64;return <button key={item.id} onClick={()=>{void trackEvent('news_open',item.id,item.title);setSelectedNews(item);}} className="flex w-full rounded-xl border p-2 text-left" style={cardStyle}>{image?<img src={image} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover"/>:<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg" style={{backgroundColor:mix(brand.primary,10)}}><Newspaper size={20}/></div>}<div className="min-w-0 p-2"><h3 className="line-clamp-2 font-serif text-sm">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs opacity-50">{item.content}</p></div></button>;})}</div></section>}

    <NewsModal item={selectedNews} onClose={()=>setSelectedNews(null)}/>
    <SohbetModal item={selectedSohbet} onClose={()=>setSelectedSohbet(null)}/>
  </div>;
}
