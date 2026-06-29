import type { PrayerData, PrayerTimings } from '../types';

const METHOD = 13; // Diyanet İşleri Başkanlığı

const adjustMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes, 0, 0);

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const cleanTime = (value: string) => {
  const match = value.match(/\d{1,2}:\d{2}/);
  return match ? match[0] : value;
};

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  cityName?: string
): Promise<PrayerData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const url =
      `https://api.aladhan.com/v1/timings` +
      `?latitude=${lat}` +
      `&longitude=${lng}` +
      `&method=${METHOD}` +
      `&school=0` +
      `&latitudeAdjustmentMethod=3` +
      `&timezonestring=Europe/Oslo`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('API response not OK');

    const data = await response.json();

    if (data.code === 200 && data.data?.timings) {
      const t = data.data.timings;
      const h = data.data.date.hijri;
      const g = data.data.date.gregorian;

      const isDrammen = cityName?.toLowerCase().includes('drammen');

      return {
        timings: {
          Fajr: isDrammen ? adjustMinutes(cleanTime(t.Fajr), 28) : cleanTime(t.Fajr),
          Sunrise: cleanTime(t.Sunrise),
          Dhuhr: cleanTime(t.Dhuhr),
          Asr: cleanTime(t.Asr),
          Maghrib: cleanTime(t.Maghrib),
          Isha: isDrammen ? adjustMinutes(cleanTime(t.Isha), -28) : cleanTime(t.Isha),
        },
        hijriDate: `${h.day} ${h.month.en} ${h.year} H`,
        gregorianDate: `${g.day} ${g.month.en} ${g.year}`,
      };
    }

    throw new Error('Invalid API response');
  } catch {
    return getFallbackTimes();
  }
}

function getFallbackTimes(): PrayerData {
  return {
    timings: {
      Fajr: '02:55',
      Sunrise: '03:58',
      Dhuhr: '13:28',
      Asr: '18:07',
      Maghrib: '22:50',
      Isha: '23:45',
    },
    hijriDate: '15 Muharrem 1448 H',
    gregorianDate: '30 Haziran 2026',
  };
}

export function getNextPrayer(timings: PrayerTimings): { name: string; time: string } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: 'Imsak', time: timings.Fajr },
    { name: 'Güneş', time: timings.Sunrise },
    { name: 'Öğle', time: timings.Dhuhr },
    { name: 'İkindi', time: timings.Asr },
    { name: 'Akşam', time: timings.Maghrib },
    { name: 'Yatsı', time: timings.Isha },
  ];

  for (const p of prayers) {
    const [h, m] = cleanTime(p.time).split(':').map(Number);
    const mins = h * 60 + m;

    if (mins > currentMinutes) return p;
  }

  return { name: 'Imsak', time: timings.Fajr };
}

export function getTimeUntil(timeStr: string): string {
  const now = new Date();
  const clean = cleanTime(timeStr);
  const [h, m] = clean.split(':').map(Number);

  const target = new Date();
  target.setHours(h, m, 0, 0);

  if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours} sa ${minutes} dk`;
  return `${minutes} dk`;
}
