import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  ChevronRight,
  Newspaper,
  BookOpen,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CloudSun,
  Mic,
  User,
  Crosshair,
  ChevronDown,
  Check,
  Search,
  Loader2,
  Clock,
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

type NewsWithDbImage = NewsItem & {
  image_base64?: string;
  image_base_64?: string;
  imageBase64?: string;
};

type SohbetWithDbImage = SohbetItem & {
  image_base_64?: string;
  image_base64?: string;
  imageBase64?: string;
};

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
    city,
    isAuto,
    loading,
    prayerData,
    showSelector,
    setShowSelector,
    searchQuery,
    searchResults,
    searching,
    handleSearch,
    selectCity,
    resetToAuto,
  } = useLocation();

  const [selectedNews, setSelectedNews] = useState<NewsWithDbImage | null>(null);
  const [selectedSohbet, setSelectedSohbet] = useState<SohbetWithDbImage | null>(null);

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

        if (!error && data) setDailyData(data);
      } catch (err) {
        console.error('Ayet/Hadis yüklenirken hata oluştu:', err);
      }
    }

    fetchDailyInspiration();
  }, [now.getDate()]);

  const nextPrayer = prayerData ? getNextPrayer(prayerData.timings) : null;
  const timeUntil = nextPrayer ? getTimeUntil(nextPrayer.time) : null;

  const prayerItems = prayerData
    ? [
        { name: 'Imsak', time: prayerData.timings.Fajr, icon: Sunrise, color: '#C5A880' },
        { name: 'Güneş', time: prayerData.timings.Sunrise, icon: Sun, color: '#E8B86D' },
        { name: 'Öğle', time: prayerData.timings.Dhuhr, icon: CloudSun, color: '#D4A04C' },
        { name: 'İkindi', time: prayerData.timings.Asr, icon: Sun, color: '#C5A880' },
        { name: 'Akşam', time: prayerData.timings.Maghrib, icon: Sunset, color: '#B8935A' },
        { name: 'Yatsı', time: prayerData.timings.Isha, icon: Moon, color: '#8B7355' },
      ]
    : [];

  const featuredNews = (news || []).slice(0, 6) as NewsWithDbImage[];
  const upcomingSohbet = (sohbet || []).slice(0, 4) as SohbetWithDbImage[];

  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const todaySohbet = (sohbet || []).filter((item: any) => item.date === todayKey);

  const ramadanStart = settings?.ramadanStartDate
    ? parseLocalDate(settings.ramadanStartDate)
    : null;

  const ramadanEnd = settings?.ramadanEndDate
    ? parseLocalDate(settings.ramadanEndDate)
    : null;

  const ramadanDay =
    settings?.ramadanEnabled && ramadanStart
      ? Math.floor((todayDate.getTime() - ramadanStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : null;

  const bayramDate = ramadanEnd
    ? new Date(ramadanEnd.getFullYear(), ramadanEnd.getMonth(), ramadanEnd.getDate() + 1)
    : null;

  const showRamadanCard =
    settings?.ramadanEnabled &&
    ramadanStart &&
    ramadanEnd &&
    todayDate >= ramadanStart &&
    todayDate <= ramadanEnd &&
    ramadanDay !== null &&
    prayerData;

  const showBayramCard =
    settings?.ramadanEnabled &&
    bayramDate &&
    todayDate.getTime() === bayramDate.getTime();

  const kurbanStart = settings?.kurbanStartDate
    ? parseLocalDate(settings.kurbanStartDate)
    : null;

  const kurbanDay =
    settings?.kurbanEnabled && kurbanStart
      ? Math.floor((todayDate.getTime() - kurbanStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : null;

  const showKurbanCard =
    settings?.kurbanEnabled &&
    kurbanDay !== null &&
    kurbanDay >= 1 &&
    kurbanDay <= 4;

  const iftarTime = prayerData?.timings?.Maghrib || '';
  const imsakTime = prayerData?.timings?.Fajr || '';

  const getIftarCountdown = () => {
    if (!iftarTime) return '';

    const [h, m] = iftarTime.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);

    const diff = target.getTime() - now.getTime();
    if (diff <= 0) {
      return '🌙 Hayırlı İftarlar';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-28">
      <header className="bg-[#2D2A26] text-[#FAF6F0] sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2.5">
          <img src="/images/dtim-logo.svg" alt="DTIM" className="w-10 h-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <h1 className="font-serif text-base leading-tight truncate">
              {settings?.mosqueName || 'Drammen Türk İnanç Cemiyeti'}
            </h1>
            <p className="text-[10px] text-[#C5A880] uppercase tracking-wider">
              {settings?.shortName || 'Norveç · Drammen'}
            </p>
          </div>
        </div>
      </header>

      <section className="px-4 pt-4">
        <div className="bg-white rounded-xl shadow-md border-2 border-[#C5A880]/25 overflow-hidden">
          <div className="bg-[#2D2A26] px-4 py-2.5 flex items-center justify-between relative">
            <div className="flex items-center gap-1.5 min-w-0">
              {isAuto ? (
                <Crosshair size={13} className="text-[#C5A880] shrink-0" />
              ) : (
                <MapPin size={13} className="text-[#C5A880] shrink-0" />
              )}

              <span className="text-xs font-medium text-[#FAF6F0] truncate max-w-[145px]">
                {city.name}
                {city.country ? `, ${city.country}` : ''}
              </span>

              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                  isAuto
                    ? 'bg-[#C5A880]/20 text-[#C5A880]'
                    : 'bg-[#FAF6F0]/10 text-[#FAF6F0]/60'
                }`}
              >
                {isAuto ? 'Otomatik' : 'Manuel'}
              </span>
            </div>

            <button
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-1 text-[10px] text-[#C5A880] hover:text-[#FAF6F0] transition-colors shrink-0"
            >
              Şehir Değiştir
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
                      placeholder="Şehir veya bölge ara..."
                      className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880]"
                      autoFocus
                    />
                    {searching && (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C5A880] animate-spin" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-[#C5A880]/15 bg-white">
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
                      Oslo, Bergen, Drammen, İstanbul, København...
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
                      <p className="text-xs font-medium text-[#2D2A26]">Konumumu Kullan</p>
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
                  Sıradaki: <strong>{nextPrayer.name}</strong>
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
              <p className="text-center text-xs text-[#2D2A26]/50 py-4">Namaz vakitleri yükleniyor...</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {prayerItems.map((p) => {
                  const Icon = p.icon;
                  const isNext = nextPrayer?.name === p.name;

                  return (
                    <div
                      key={p.name}
                      className={`rounded-lg p-2 text-center border-2 ${
                        isNext ? 'bg-[#2D2A26] border-[#C5A880]' : 'bg-[#FAF6F0] border-[#C5A880]/20'
                      }`}
                    >
                      <Icon
                        size={14}
                        className="mx-auto mb-1"
                        style={{ color: isNext ? '#C5A880' : p.color }}
                      />
                      <p className={`text-[10px] ${isNext ? 'text-[#FAF6F0]/60' : 'text-[#2D2A26]/60'}`}>
                        {p.name}
                      </p>
                      <p className={`text-xs font-semibold ${isNext ? 'text-[#FAF6F0]' : 'text-[#2D2A26]'}`}>
                        {p.time}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <InstallAppButton />

      {showRamadanCard && (
        <section className="px-4 mt-4">
          <div className="bg-[#2D2A26] rounded-xl p-5 text-[#FAF6F0] border-2 border-[#C5A880]/30">
            <div className="flex items-center gap-2 mb-3">
              <Moon size={18} className="text-[#C5A880]" />
              <h2 className="font-serif text-lg text-[#C5A880]">RAMAZAN</h2>
            </div>

            <p className="text-sm text-[#C5A880] font-medium mt-1 mb-3">
              Ramazan'ın {ramadanDay}. Günü
            </p>

            <div className="bg-[#FAF6F0]/10 rounded-2xl p-6 text-center mb-5 border border-[#C5A880]/20">
              <p className="text-sm text-[#C5A880] mb-4">
                {getIftarCountdown().includes('Hayırlı') ? 'İftar Vakti' : 'İftara Kalan'}
              </p>
              <div className="font-serif text-4xl font-bold text-[#C5A880] text-center leading-tight">
                {getIftarCountdown().includes('Hayırlı') ? (
                  <span className="font-serif text-[52px] font-bold text-[#C5A880] leading-tight">
                    Hayırlı
                    <br />
                    İftarlar
                  </span>
                ) : (
                  getIftarCountdown()
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FAF6F0]/10 rounded-xl p-4 text-center border border-[#C5A880]/20">
                <p className="text-xs text-[#FAF6F0]/60">İmsak</p>
                <p className="font-semibold text-sm">{imsakTime}</p>
              </div>

              <div className="bg-[#FAF6F0]/10 rounded-xl p-4 text-center border border-[#C5A880]/20">
                <p className="text-xs text-[#FAF6F0]/60">İftar</p>
                <p className="font-semibold text-sm">{iftarTime}</p>
              </div>
            </div>

            {todaySohbet.length > 0 && (
              <button
                onClick={() => setSelectedSohbet(todaySohbet[0])}
                className="w-full mt-4 py-4 rounded-xl bg-[#D4B483] text-white font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Calendar size={18} />
                <span>Bugünkü Program</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>
      )}

      {showBayramCard && (
        <section className="px-4 mt-4">
          <div className="bg-[#2D2A26] rounded-xl p-6 text-center text-[#FAF6F0] border-2 border-[#C5A880]/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Moon size={20} className="text-[#C5A880]" />
              <h2 className="font-serif text-xl text-[#C5A880]">BAYRAM</h2>
            </div>

            <p className="font-serif text-3xl font-bold text-[#C5A880] leading-tight mb-3">
              Bayramınız
              <br />
              Mübarek Olsun
            </p>

            <p className="text-sm text-[#FAF6F0]/70 leading-relaxed">
              Allah ibadetlerinizi kabul eylesin.
              <br />
              Sağlık, huzur ve bereket dolu bayramlar dileriz.
            </p>
          </div>
        </section>
      )}

      {showKurbanCard && (
        <section className="px-4 mt-4">
          <div className="bg-[#2D2A26] rounded-xl p-6 text-center text-[#FAF6F0] border-2 border-[#C5A880]/30">
            <h2 className="font-serif text-xl text-[#C5A880] mb-3">
              KURBAN BAYRAMI
            </h2>

            <p className="text-sm text-[#C5A880] font-medium mb-3">
              Kurban Bayramı'nın {kurbanDay}. Günü
            </p>

            <p className="font-serif text-3xl font-bold text-[#C5A880] leading-tight mb-4">
              Kurban Bayramınız
              <br />
              Mübarek Olsun
            </p>

            <p className="text-sm text-[#FAF6F0]/70 leading-relaxed">
              Allah kurbanlarınızı kabul eylesin.
              <br />
              Sağlık, huzur ve bereket dolu bayramlar dileriz.
            </p>

            {todaySohbet.length > 0 && (
              <button
                onClick={() => setSelectedSohbet(todaySohbet[0])}
                className="w-full mt-5 py-4 rounded-xl bg-[#D4B483] text-white font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Calendar size={18} />
                <span>Bugünkü Bayram Programı</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>
      )}

      {dailyData && (
        <section className="px-4 mt-4">
          <div className="bg-[#2D2A26] rounded-xl p-5 text-[#FAF6F0]">
            {dailyData.verse_text && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-[#C5A880]" />
                  <h3 className="text-[#C5A880] text-[11px] font-bold uppercase">Bugünün Ayeti</h3>
                </div>
                <p className="text-sm mb-4">{dailyData.verse_text}</p>
              </>
            )}

            {dailyData.hadith_text && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-[#C5A880]" />
                  <h3 className="text-[#C5A880] text-[11px] font-bold uppercase">Bugünün Hadisi</h3>
                </div>
                <p className="text-sm">{dailyData.hadith_text}</p>
              </>
            )}
          </div>
        </section>
      )}

      <section className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-1">
          <Mic size={18} className="text-[#C5A880]" />
          <h2 className="font-serif text-lg text-[#2D2A26]">Yaklaşan Sohbet / Ders</h2>
        </div>

        {upcomingSohbet.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center border border-[#C5A880]/20">
            <Mic size={28} className="mx-auto text-[#C5A880]/40 mb-2" />
            <p className="text-sm text-[#2D2A26]/50">Yaklaşan program bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingSohbet.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedSohbet(item)}
                className="w-full bg-white rounded-xl border border-[#C5A880]/20 flex text-left overflow-hidden"
              >
                <div className="w-16 shrink-0 bg-[#2D2A26] flex flex-col items-center justify-center text-[#FAF6F0] py-3">
                  <span className="text-[10px] uppercase text-[#C5A880]">
                    {new Date(item.date).toLocaleDateString('tr-TR', { month: 'short' })}
                  </span>
                  <span className="font-serif text-xl leading-none">{new Date(item.date).getDate()}</span>
                  <span className="text-[10px] text-[#FAF6F0]/60 mt-0.5">{item.time}</span>
                </div>

                <div className="flex-1 p-3 min-w-0">
                  <h3 className="font-serif text-sm text-[#2D2A26] line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-[#2D2A26]/50 mt-1 line-clamp-2">{item.description}</p>

                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-[#2D2A26]/40">
                      <MapPin size={10} />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#2D2A26]/40">
                      <User size={10} />
                      {item.speaker}
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

      <section className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <Newspaper size={18} className="text-[#C5A880]" />
          <h2 className="font-serif text-lg text-[#2D2A26]">Duyurular ve Haberler</h2>
        </div>

        {featuredNews.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-[#C5A880]/20">
            <Newspaper size={28} className="mx-auto text-[#C5A880]/40 mb-2" />
            <p className="text-sm text-[#2D2A26]/50">Henüz haber eklenmemiş.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {featuredNews.map((item) => {
              const imageSrc = item.imageBase64 || item.image_base_64 || item.image_base64;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                  className="w-full bg-white rounded-xl border border-[#C5A880]/20 flex text-left p-2"
                >
                  {imageSrc ? (
                    <div className="w-20 h-20 shrink-0 overflow-hidden rounded-lg">
                      <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 bg-[#C5A880]/10 rounded-lg flex items-center justify-center">
                      <Newspaper size={20} className="text-[#C5A880]/40" />
                    </div>
                  )}

                  <div className="pl-3 py-1 min-w-0">
                    <span className="inline-block text-[9px] font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-sm line-clamp-2 mt-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.content}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#2D2A26]/40">
                      <Calendar size={10} />
                      {new Date(item.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
      <SohbetModal item={selectedSohbet} onClose={() => setSelectedSohbet(null)} />
    </div>
  );
}
