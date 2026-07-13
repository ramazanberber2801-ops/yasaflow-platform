import type { PrayerData, PrayerTimings } from '../types';

const METHOD = 13; // Diyanet İşleri Başkanlığı
let activePrayerTimezone = '';

const adjustMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const total = ((h * 60 + m + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const cleanTime = (value: string) => {
  const match = value.match(/\d{1,2}:\d{2}/);
  return match ? match[0] : value;
};

function getZonedParts(timezone?: string) {
  const now = new Date();
  const zone = timezone || activePrayerTimezone;
  if (!zone) return { hours: now.getHours(), minutes: now.getMinutes() };

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    return {
      hours: Number(parts.find((part) => part.type === 'hour')?.value || 0),
      minutes: Number(parts.find((part) => part.type === 'minute')?.value || 0),
    };
  } catch {
    return { hours: now.getHours(), minutes: now.getMinutes() };
  }
}

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  cityName?: string
): Promise<PrayerData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const url =
      `https://api.aladhan.com/v1/timings` +
      `?latitude=${lat}` +
      `&longitude=${lng}` +
      `&method=${METHOD}` +
      `&school=0` +
      `&latitudeAdjustmentMethod=3`;

    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('API response not OK');

    const data = await response.json();

    if (data.code === 200 && data.data?.timings) {
      const t = data.data.timings;
      const h = data.data.date.hijri;
      const g = data.data.date.gregorian;
      const timezone = String(data.data.meta?.timezone || '');
      activePrayerTimezone = timezone;
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
        timezone,
      };
    }

    throw new Error('Invalid API response');
  } catch {
    return getFallbackTimes();
  }
}

function getFallbackTimes(): PrayerData {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  activePrayerTimezone = timezone;
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
    timezone,
  };
}

export function getNextPrayer(timings: PrayerTimings, timezone?: string): { name: string; time: string } | null {
  const now = getZonedParts(timezone);
  const currentMinutes = now.hours * 60 + now.minutes;

  const prayers = [
    { name: 'Imsak', time: timings.Fajr },
    { name: 'Güneş', time: timings.Sunrise },
    { name: 'Öğle', time: timings.Dhuhr },
    { name: 'İkindi', time: timings.Asr },
    { name: 'Akşam', time: timings.Maghrib },
    { name: 'Yatsı', time: timings.Isha },
  ];

  for (const prayer of prayers) {
    const [h, m] = cleanTime(prayer.time).split(':').map(Number);
    if (h * 60 + m > currentMinutes) return prayer;
  }

  return { name: 'Imsak', time: timings.Fajr };
}

export function getTimeUntil(timeStr: string, timezone?: string): string {
  const now = getZonedParts(timezone);
  const [h, m] = cleanTime(timeStr).split(':').map(Number);
  let diffMinutes = h * 60 + m - (now.hours * 60 + now.minutes);
  if (diffMinutes < 0) diffMinutes += 1440;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours > 0) return `${hours} sa ${minutes} dk`;
  return `${minutes} dk`;
}
