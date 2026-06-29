import { useState, useEffect, useCallback, useRef } from 'react';
import type { PrayerData } from '../types';
import { fetchPrayerTimes } from './prayerTimes';

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface SelectedCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = 'dtim_selected_city';

const DEFAULT_CITY: SelectedCity = {
  name: 'Drammen',
  country: 'Norveç',
  latitude: 59.7440,
  longitude: 10.2045,
};

function loadStoredCity(): { city: SelectedCity; isAuto: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { city: parsed.city, isAuto: parsed.isAuto };
    }
  } catch { /* ignore */ }
  return { city: DEFAULT_CITY, isAuto: true };
}

function saveStoredCity(city: SelectedCity, isAuto: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, isAuto }));
  } catch { /* ignore */ }
}

export function useLocation() {
  const initial = loadStoredCity();
  const [city, setCity] = useState<SelectedCity>(initial.city);
  const [isAuto, setIsAuto] = useState(initial.isAuto);
  const [loading, setLoading] = useState(true);
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch prayer times whenever city changes
  useEffect(() => {
    setLoading(true);
    fetchPrayerTimes(city.latitude, city.longitude).then(data => {
      setPrayerData(data);
      setLoading(false);
    });
  }, [city.latitude, city.longitude]);

  // Try to get auto location on first mount if isAuto
  useEffect(() => {
    if (!isAuto) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode using Open-Meteo
        fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=tr&count=1`
        )
          .then(res => res.json())
          .then(data => {
            if (data?.results?.[0]) {
              const r = data.results[0];
              const newCity: SelectedCity = {
                name: r.name,
                country: r.country ?? '',
                latitude: r.latitude,
                longitude: r.longitude,
              };
              setCity(newCity);
              saveStoredCity(newCity, true);
            } else {
              // Use raw coordinates if reverse geocode fails
              const newCity: SelectedCity = {
                name: 'Mevcut Konum',
                country: '',
                latitude,
                longitude,
              };
              setCity(newCity);
              saveStoredCity(newCity, true);
            }
          })
          .catch(() => {
            // Keep default city if reverse geocode fails
          });
      },
      () => {
        // Keep default city if geolocation denied
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=tr&format=json`
        );
        const data = await res.json();
        setSearchResults(data?.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const selectCity = useCallback((result: CityResult) => {
    const newCity: SelectedCity = {
      name: result.name,
      country: result.country ?? '',
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setCity(newCity);
    setIsAuto(false);
    setShowSelector(false);
    setSearchQuery('');
    setSearchResults([]);
    saveStoredCity(newCity, false);
  }, []);

  const resetToAuto = useCallback(() => {
    setIsAuto(true);
    setShowSelector(false);
    setSearchQuery('');
    setSearchResults([]);

    // Try geolocation again
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=tr&count=1`
          )
            .then(res => res.json())
            .then(data => {
              if (data?.results?.[0]) {
                const r = data.results[0];
                const newCity: SelectedCity = {
                  name: r.name,
                  country: r.country ?? '',
                  latitude: r.latitude,
                  longitude: r.longitude,
                };
                setCity(newCity);
                saveStoredCity(newCity, true);
              }
            })
            .catch(() => {});
        },
        () => {
          // Fall back to default
          setCity(DEFAULT_CITY);
          saveStoredCity(DEFAULT_CITY, true);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    } else {
      setCity(DEFAULT_CITY);
      saveStoredCity(DEFAULT_CITY, true);
    }
  }, []);

  return {
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
    pref: null,
  };
}
