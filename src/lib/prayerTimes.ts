export async function fetchPrayerTimes(lat: number, lng: number): Promise<PrayerData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${METHOD}&school=1&latitudeAdjustmentMethod=3&timezonestring=Europe/Oslo`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('API response not OK');
    const data = await response.json();

    const cleanTime = (value: string) => {
      const match = value.match(/\d{1,2}:\d{2}/);
      return match ? match[0] : value;
    };

    if (data.code === 200 && data.data?.timings) {
      const h = data.data.date.hijri;
      const g = data.data.date.gregorian;

      return {
        timings: {
          Fajr: cleanTime(data.data.timings.Fajr),
          Sunrise: cleanTime(data.data.timings.Sunrise),
          Dhuhr: cleanTime(data.data.timings.Dhuhr),
          Asr: cleanTime(data.data.timings.Asr),
          Maghrib: cleanTime(data.data.timings.Maghrib),
          Isha: cleanTime(data.data.timings.Isha),
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
