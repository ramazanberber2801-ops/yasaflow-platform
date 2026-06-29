/**
 * Lightweight geocoding using the free Open-Meteo Geocoding API.
 * No API key required. Supports worldwide city/region search.
 * Docs: https://open-meteo.com/en/docs/geocoding-api
 */

export interface GeoResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

/**
 * Search for cities/regions by name. Returns up to `count` results.
 * Works for any global location (Oslo, Bergen, Istanbul, Aarhus, etc.)
 */
export async function searchCities(query: string, count = 8): Promise<GeoResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=${count}&language=tr&format=json`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!response.ok) return [];
    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: {
      id: number;
      name: string;
      country?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
    }) => ({
      id: r.id,
      name: r.name,
      country: r.country ?? '',
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  } catch {
    return [];
  }
}

/**
 * Reverse geocode coordinates to a human-readable city name.
 * Uses Open-Meteo's reverse geocoding endpoint.
 * Hata veya CORS durumunda varsayılan olarak "Drammen" döner.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&language=tr&format=json`,
      { 
        signal: controller.signal,
        mode: 'cors' // CORS politikasını tarayıcıya açıkça dikte ediyoruz
      },
    );
    clearTimeout(timeoutId);

    // Eğer HTTP kodu 200 değilse hataya zorla (catch bloğuna düşsün)
    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return "Drammen";
    }

    const r = data.results[0];
    return r.name ?? "Drammen";
  } catch (error) {
    console.warn("Geocoding başarısız oldu veya CORS engeline takıldı. Varsayılan konum (Drammen) seçiliyor:", error);
    // Cankurtaran simidimiz: API patlasa bile "Drammen" dönerek ön yüzün çökmesini engelliyoruz.
    return "Drammen";
  }
}
