import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, ChevronRight, Newspaper,
  BookOpen, Sun, Moon, Sunrise, Sunset, CloudSun,
  Mic, User, Crosshair, Navigation, ChevronDown, Check, Search, Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getNextPrayer, getTimeUntil } from '../lib/prayerTimes';
import { useClock } from '../lib/useClock';
import { useLocation } from '../lib/useLocation';
import { NewsModal } from '../components/NewsModal';
import { SohbetModal } from '../components/SohbetModal';
import { InstallAppButton } from '../components/InstallAppButton';
import { supabase } from '../lib/supabase';
import type { NewsItem, SohbetItem } from '../types';

export function HomePage() {
  const { news, sohbet, settings } = useApp();
  const [dailyData, setDailyData] = useState<{
    verse_text?: string;
    verse_reference?: string;
    hadith_text?: string;
    hadith_source?: string;
  } | null>(null);

  const now = useClock();
  const {
    city, isAuto, loading, prayerData, showSelector,
    setShowSelector, searchQuery, searchResults, searching,
    handleSearch, selectCity, resetToAuto,
  } = useLocation();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedSohbet, setSelectedSohbet] = useState<SohbetItem | null>(null);

  useEffect(() => {
    async function fetchDailyInspiration() {
      try {
        if (!supabase) return;

        const start = new Date(new Date().getFullYear(), 0, 0);
        const diff = new Date().getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const { data, error } = await supabase
          .from('inspiration')
          .select('verse_text, verse_reference, hadith_text, hadith_source')
          .eq('day_of_year', dayOfYear)
          .single();
        
        if (!error && data) {
          setDailyData(data);
        } else if (error) {
          console.error("Supabase veri çekme hatası:", error.message);
        }
      } catch (err) {
        console.error("Ayet/Hadis yüklenirken hata oluştu:", err);
      }
    }
    fetchDailyInspiration();
  }, [now.getDate()]);

  const nextPrayer = prayerData ? getNextPrayer(prayerData.timings) : null;
  const timeUntil = nextPrayer ? getTimeUntil(nextPrayer.time) : null;

  const prayerItems = prayerData ? [
    { name: 'Sabah', time: prayerData.timings.Fajr, icon: Sunrise, color: '#C5A880' },
    { name: 'Güneş', time: prayerData.timings.Sunrise, icon: Sun, color: '#E8B86D' },
    { name: 'Öğle', time: prayerData.timings.Dhuhr, icon: CloudSun, color: '#D4A04C' },
    { name: 'İkindi', time: prayerData.timings.Asr, icon: Sun, color: '#C5A880' },
    { name: 'Akşam', time: prayerData.timings.Maghrib, icon: Sunset, color: '#B8935A' },
    { name: 'Yatsı', time: prayerData.timings.Isha, icon: Moon, color: '#8B7355' },
  ] : [];

  const featuredNews = news.slice(0, 6);
  const upcomingSohbet = sohbet.slice(0, 4);

  return (
    <div className="min-h-screen pb-28">
      <header className="bg-[#2D2A26] text-[#FAF6F0] sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2.5">
          <img src="/images/dtim-logo.svg" alt="DTIM" className="w-10 h-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <h1 className="font-serif text-base leading-tight truncate">{settings.mosqueName}</h1>
            <p className="text-[10px] text-[#C5A880] uppercase tracking-wider">{settings.shortName}</p>
          </div>
        </div>
      </header>

      <section className="px-4 pt-4">
        <div className="bg-white rounded-xl shadow-md border-2 border-[#C5A880]/25 overflow-hidden">
          <div className="bg-[#2D2A26] px-4 py-2.5 flex items-center justify-between relative">
            <div className="flex items-center gap-1.5">
              {isAuto ? <Crosshair size={13} className="text-[#C5A880] shrink-0" /> : <MapPin size={13} className="text-[#C5A880] shrink-0" />}
              <span className="text-xs font-medium text-[#FAF6F0] truncate max-w-[140px]">
                {city.name}{city.country ? `, ${city.country}` : ''}
              </span>
            </div>
            <button onClick={() => setShowSelector(!showSelector)} className="flex items-center gap-1 text-[10px] text-[#C5A880] hover:text-[#FAF6F0] transition-colors shrink-0">
              Değiştir <ChevronDown size={11} className={`transition-transform ${showSelector ? 'rotate-180' : ''}`} />
            </button>

            {showSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#FAF6F0] rounded-b-xl shadow-2xl border-2 border-t-0 border-[#C5A880]/30 overflow-hidden z-20">
                <div className="p-3 space-y-3">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2A26]/30" />
                    <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Şehir Ara..." className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm focus:outline-none focus:border-[#C5A880]" />
                  </div>
                  {searchResults.map((r) => (
                    <button key={r.id} onClick={() => selectCity(r)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-[#C5A880]/10 last:border-b-0">
                      <MapPin size={13} className="text-[#C5A880]" />
                      <div className="min-w-0"><p className="text-xs truncate">{r.name}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {prayerItems.map((p) => {
                const Icon = p.icon;
                const isNext = nextPrayer?.name === p.name;
                return (
                  <div key={p.name} className={`rounded-lg p-2 text-center border-2 ${isNext ? 'bg-[#2D2A26] border-[#C5A880]' : 'bg-[#FAF6F0] border-[#C5A880]/20'}`}>
                    <Icon size={14} className="mx-auto mb-1" style={{ color: isNext ? '#C5A880' : p.color }} />
                    <p className={`text-[10px] ${isNext ? 'text-[#FAF6F0]/60' : 'text-[#2D2A26]/60'}`}>{p.name}</p>
                    <p className={`text-xs font-semibold ${isNext ? 'text-[#FAF6F0]' : 'text-[#2D2A26]'}`}>{p.time}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <InstallAppButton />

      <section className="px-4 mt-4">
        {dailyData && (
          <div className="bg-[#2D2A26] rounded-xl p-5 text-[#FAF6F0]">
            <h3 className="text-[#C5A880] text-[11px] font-bold uppercase mb-2">Günün Ayeti</h3>
            <p className="text-sm mb-4">{dailyData.verse_text}</p>
            <h3 className="text-[#C5A880] text-[11px] font-bold uppercase mb-2">Günün Hadisi</h3>
            <p className="text-sm">{dailyData.hadith_text}</p>
          </div>
        )}
      </section>

      <section className="px-4 mt-5">
        <h2 className="font-serif text-lg mb-3">Haberler & Duyurular</h2>
        <div className="space-y-2.5">
          {featuredNews.map((item) => (
            <button key={item.id} onClick={() => setSelectedNews(item)} className="w-full bg-white rounded-xl border border-[#C5A880]/20 flex text-left p-2">
              {(item.imageBase64 || item.image_base64) ? (
                <div className="w-20 h-20 shrink-0 overflow-hidden rounded-lg">
                  <img src={item.imageBase64 || item.image_base64} alt={item.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 shrink-0 bg-[#C5A880]/10 rounded-lg flex items-center justify-center">
                  <Newspaper size={20} className="text-[#C5A880]/40" />
                </div>
              )}
              <div className="pl-3 py-1">
                <h3 className="font-serif text-sm line-clamp-2">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.content}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
      <SohbetModal item={selectedSohbet} onClose={() => setSelectedSohbet(null)} />
    </div>
  );
}
