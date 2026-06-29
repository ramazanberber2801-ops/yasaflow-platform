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
  const [dailyData, setDailyData] = useState<any>(null);

  const now = useClock();
  const {
    city, isAuto, loading, prayerData, showSelector,
    setShowSelector, searchQuery, searchResults, searching,
    handleSearch, selectCity,
  } = useLocation();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedSohbet, setSelectedSohbet] = useState<SohbetItem | null>(null);

  useEffect(() => {
    async function fetchDailyInspiration() {
      if (!supabase) return;
      const start = new Date(new Date().getFullYear(), 0, 0);
      const diff = new Date().getTime() - start.getTime();
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

      const { data } = await supabase
        .from('inspiration')
        .select('*')
        .eq('day_of_year', dayOfYear)
        .maybeSingle();
      if (data) setDailyData(data);
    }
    fetchDailyInspiration();
  }, []);

  const nextPrayer = prayerData ? getNextPrayer(prayerData.timings) : null;
  const prayerItems = prayerData ? [
    { name: 'Sabah', time: prayerData.timings.Fajr, icon: Sunrise, color: '#C5A880' },
    { name: 'Güneş', time: prayerData.timings.Sunrise, icon: Sun, color: '#E8B86D' },
    { name: 'Öğle', time: prayerData.timings.Dhuhr, icon: CloudSun, color: '#D4A04C' },
    { name: 'İkindi', time: prayerData.timings.Asr, icon: Sun, color: '#C5A880' },
    { name: 'Akşam', time: prayerData.timings.Maghrib, icon: Sunset, color: '#B8935A' },
    { name: 'Yatsı', time: prayerData.timings.Isha, icon: Moon, color: '#8B7355' },
  ] : [];

  const featuredNews = news.slice(0, 6);
  const upcomingSohbet = (sohbet || []).slice(0, 4);

  return (
    <div className="min-h-screen pb-28">
      <header className="bg-[#2D2A26] text-[#FAF6F0] sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="font-serif text-base">{settings.mosqueName}</h1>
        </div>
      </header>

      {/* Sohbetler Bölümü */}
      <section className="px-4 mt-5">
        <h2 className="font-serif text-lg mb-3">Sohbetler & Dersler</h2>
        <div className="space-y-2.5">
          {upcomingSohbet.map((item: any) => (
            <button key={item.id} onClick={() => setSelectedSohbet(item)} className="w-full bg-white rounded-xl border border-[#C5A880]/20 p-2 flex items-center">
              <div className="w-16 h-16 bg-[#C5A880]/10 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-[#C5A880]" />
              </div>
              <div className="pl-3 text-left">
                <h3 className="font-serif text-sm">{item.title}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Haberler Bölümü */}
      <section className="px-4 mt-5">
        <h2 className="font-serif text-lg mb-3">Haberler</h2>
        <div className="space-y-2.5">
          {featuredNews.map((item) => (
            <button key={item.id} onClick={() => setSelectedNews(item)} className="w-full bg-white rounded-xl border border-[#C5A880]/20 p-2 flex">
              <img src={item.imageBase64 || item.image_base64 || ''} className="w-16 h-16 object-cover rounded-lg" alt="" />
              <div className="pl-3 text-left">
                <h3 className="font-serif text-sm">{item.title}</h3>
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
