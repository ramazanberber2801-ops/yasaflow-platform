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
import { supabase } from '../lib/supabaseClient'; // Supabase bağlantısı eklendi
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
    handleSearch, selectCity, resetToAuto, pref,
  } = useLocation();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedSohbet, setSelectedSohbet] = useState<SohbetItem | null>(null);

  // Günün Ayet ve Hadisini Yılın Gününe Göre Supabase'den Çekme
  useEffect(() => {
    async function fetchDailyInspiration() {
      try {
        const start = new Date(new Date().getFullYear(), 0, 0);
        const diff = new Date().getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const { data, error } = await supabase
          .from('daily_inspiration')
          .select('verse_text, verse_reference, hadith_text, hadith_source')
          .eq('day_of_year', dayOfYear)
          .single();
        
        if (!error && data) {
          setDailyData(data);
        }
      } catch (err) {
        console.error("Ayet/Hadis yüklenirken hata oluştu:", err);
      }
    }
    fetchDailyInspiration();
  }, [now.getDate()]); // Gün değiştiğinde otomatik yenilenir

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
      {/* ===== Top Header ===== */}
      <header className="bg-[#2D2A26] text-[#FAF6F0] sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2.5">
          <img src="/images/dtim-logo.svg" alt="DTIM" className="w-10 h-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <h1 className="font-serif text-base leading-tight truncate">{settings.mosqueName}</h1>
            <p className="text-[10px] text-[#C5A880] uppercase tracking-wider">{settings.shortName}</p>
          </div>
        </div>
      </header>

      {/* ===== Prayer Times Section ===== */}
      <section className="px-4 pt-4">
        <div className="bg-white rounded-xl shadow-md border-2 border-[#C5A880]/25 overflow-hidden">
          <div className="bg-[#2D2A26] px-4 py-2.5 flex items-center justify-between relative">
            <div className="flex items-center gap-1.5">
              {isAuto ? (
                <Crosshair size={13} className="text-[#C5A880] shrink-0" />
              ) : (
                <MapPin size={13} className="text-[#C5A880] shrink-0" />
              )}
              <span className="text-xs font-medium text-[#FAF6F0] truncate max-w-[140px]">
                {city.name}{city.country ? `, ${city.country}` : ''}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                isAuto ? 'bg-[#C5A880]/20 text-[#C5A880]' : 'bg-[#FAF6F0]/10 text-[#FAF6F0]/50'
              }`}>
                {isAuto ? 'Otomatik' : 'Manuel'}
              </span>
            </div>
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-1 text-[10px] text-[#C5A880] hover:text-[#FAF6F0] transition-colors shrink-0"
            >
              Değiştir
              <ChevronDown size={11} className={`transition-transform ${showSelector ? 'rotate-180' : ''}`} />
            </button>

            {showSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#FAF6F0] rounded-b-xl shadow-2xl border-2 border-t-0 border-[#C5A880]/30 overflow-hidden z-20">
                <div className="p-3 space-y-3">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2A26]/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Şehir veya Bölge Ara..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                      autoFocus
                    />
                    {searching && (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C5A880] animate-spin" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-[#C5A880]/15">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => selectCity(r)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#C5A880]/10 transition-colors border-b border-[#C5A880]/10 last:border-b-0"
                        >
                          <MapPin size={13} className="text-[#C5A880] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[#2D2A26] truncate">{r.name}</p>
                            <p className="text-[10px] text-[#2D2A26]/40 truncate">
                              {[r.admin1, r.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-xs text-[#2D2A26]/40 text-center py-3">
                      Sonuç bulunamadı. Başka bir şehir deneyin.
                    </p>
                  )}

                  {searchQuery.trim().length < 2 && (
                    <p className="text-[10px] text-[#2D2A26]/40 text-center py-1">
                      Oslo, Bergen, Istanbul, Aarhus, København...
                    </p>
                  )}
                </div>

                <div className="border-t border-[#C5A880]/15">
                  <button
                    onClick={resetToAuto}
                    className={`w-full flex items-center gap-2 px-3 py-3 text-left transition-colors ${
                      isAuto ? 'bg-[#C5A880]/15' : 'hover:bg-[#C5A880]/5'
                    }`}
                  >
                    <Crosshair size={15} className="text-[#C5A880] shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[#2D2A26]">Konumumu Bul (Otomatik)</p>
                      <p className="text-[10px] text-[#2D2A26]/40">GPS ile mevcut konumunu algıla</p>
                    </div>
                    {isAuto && <Check size={14} className="text-[#C5A880] shrink-0" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {nextPrayer && (
            <div className="bg-[#C5A880]/10 border-b-2 border-[#C5A880]/20 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#C5A880]" />
                <span className="text-[11px] text-[#2D2A26]/70">
                  Sıradaki: <span className="font-semibold text-[#2D2A26]">{nextPrayer.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#2D2A26] tabular-nums">{nextPrayer.time}</span>
                <span className="text-[10px] bg-[#C5A880] text-white px-1.5 py-0.5 rounded-full font-medium tabular-nums">
                  {timeUntil}
                </span>
              </div>
            </div>
          )}

          <div className="p-2.5">
            {loading ? (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#FAF6F0] rounded-lg p-2 animate-pulse border border-[#C5A880]/15">
                    <div className="h-2.5 bg-[#C5A880]/20 rounded w-10 mb-1.5"></div>
                    <div className="h-3 bg-[#C5A880]/20 rounded w-14"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {prayerItems.map((p) => {
                  const Icon = p.icon;
                  const isNext = nextPrayer?.name === p.name;
                  return (
                    <div
                      key={p.name}
                      className={`rounded-lg p-2 text-center border-2 transition-all ${
                        isNext
                          ? 'bg-[#2D2A26] border-[#C5A880] shadow-md'
                          : 'bg-[#FAF6F0] border-[#C5A880]/20'
                      }`}
                    >
                      <Icon
                        size={14}
                        className="mx-auto mb-1"
                        style={{ color: isNext ? '#C5A880' : p.color }}
                      />
                      <p className={`text-[10px] mb-0.5 ${isNext ? 'text-[#FAF6F0]/60' : 'text-[#2D2A26]/60'}`}>{p.name}</p>
                      <p className={`text-xs font-semibold tabular-nums ${isNext ? 'text-[#FAF6F0]' : 'text-[#2D2A26]'}`}>{p.time}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <InstallAppButton />

      {/* ===== Günlük Ayet / Hadit Veritabanı Alanı ===== */}
      {dailyData && (
        <section className="px-4 mt-4">
          <div className="bg-[#2D2A26] rounded-xl border-2 border-[#2D2A26] shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06]">
              <BookOpen size={128} className="text-[#C5A880]" />
            </div>
            <div className="relative p-5 space-y-5">
              {/* Ayet Bölümü */}
              {dailyData.verse_text && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-[#C5A880]/20 flex items-center justify-center">
                      <BookOpen size={14} className="text-[#C5A880]" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#C5A880] uppercase tracking-wider">Günün Ayeti</span>
                  </div>
                  <p className="text-sm text-[#FAF6F0]/90 leading-relaxed mb-2">{dailyData.verse_text}</p>
                  {dailyData.verse_reference && (
                    <p className="text-[11px] text-[#C5A880]/70 italic">{dailyData.verse_reference}</p>
                  )}
                </div>
              )}

              {/* Hadis Bölümü */}
              {dailyData.hadith_text && (
                <div className="border-t border-[#FAF6F0]/10 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-[#C5A880]/20 flex items-center justify-center">
                      <BookOpen size={14} className="text-[#C5A880]" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#C5A880] uppercase tracking-wider">Günün Hadisi</span>
                  </div>
                  <p className="text-sm text-[#FAF6F0]/90 leading-relaxed mb-2">{dailyData.hadith_text}</p>
                  {dailyData.hadith_source && (
                    <p className="text-[11px] text-[#C5A880]/70 italic">{dailyData.hadith_source}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== Yaklaşan Sohbet / Ders ===== */}
      <section className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mic size={18} className="text-[#C5A880]" />
            <h2 className="font-serif text-lg text-[#2D2A26]">Yaklaşan Sohbet / Ders</h2>
          </div>
        </div>

        {upcomingSohbet.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border-2 border-[#C5A880]/25">
            <Mic size={32} className="mx-auto text-[#C5A880]/40 mb-2" />
            <p className="text-sm text-[#2D2A26]/50">Yaklaşan program bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingSohbet.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedSohbet(item)}
                className="w-full bg-white rounded-xl border-2 border-[#C5A880]/25 overflow-hidden flex hover:border-[#C5A880]/50 hover:shadow-md transition-all text-left group"
              >
                <div className="w-16 shrink-0 bg-[#2D2A26] flex flex-col items-center justify-center text-[#FAF6F0] py-3 border-r-2 border-[#C5A880]/20">
                  <span className="text-[10px] uppercase text-[#C5A880]">
                    {new Date(item.date).toLocaleDateString('tr-TR', { month: 'short' })}
                  </span>
                  <span className="font-serif text-xl leading-none">{new Date(item.date).getDate()}</span>
                  <span className="text-[10px] text-[#FAF6F0]/60 mt-0.5 tabular-nums">{item.time}</span>
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <h3 className="font-serif text-sm text-[#2D2A26] line-clamp-1 leading-snug">{item.title}</h3>
                  <p className="text-xs text-[#2D2A26]/50 mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-[#2D2A26]/40">
                      <MapPin size={10} />{item.location}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#2D2A26]/40">
                      <User size={10} />{item.speaker}
                    </span>
                  </div>
                </div>
                <div className="flex items-center pr-3">
                  <ChevronRight size={18} className="text-[#C5A880]/40" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ===== News Section ===== */}
      <section className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-[#C5A880]" />
            <h2 className="font-serif text-lg text-[#2D2A26]">Haberler & Duyurular</h2>
          </div>
        </div>

        {featuredNews.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border-2 border-[#C5A880]/25">
            <Newspaper size={32} className="mx-auto text-[#C5A880]/40 mb-2" />
            <p className="text-sm text-[#2D2A26]/50">Henüz haber eklenmemiş.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {featuredNews.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="w-full bg-white rounded-xl border-2 border-[#C5A880]/25 overflow-hidden flex hover:border-[#C5A880]/50 hover:shadow-md transition-all text-left group"
              >
                {item.imageBase64 ? (
                  <div className="w-20 h-20 shrink-0 overflow-hidden bg-[#FAF6F0] border-r-2 border-[#C5A880]/15">
                    <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ) : (
                  <div className="w-20 h-20 shrink-0 bg-[#C5A880]/10 border-r-2 border-[#C5A880]/15 flex items-center justify-center">
                    <Newspaper size={20} className="text-[#C5A880]/40" />
                  </div>
                )}
                <div className="flex-1 p-3 min-w-0">
                  <span className="inline-block text-[9px] font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-sm text-[#2D2A26] mt-1.5 line-clamp-2 leading-snug">{item.title}</h3>
                  <p className="text-xs text-[#2D2A26]/50 mt-1 line-clamp-1">{item.content}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#2D2A26]/40">
                    <Calendar size={10} />
                    {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center pr-3">
                  <ChevronRight size={18} className="text-[#C5A880]/40" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
      <SohbetModal item={selectedSohbet} onClose={() => setSelectedSohbet(null)} />
    </div>
  );
}
