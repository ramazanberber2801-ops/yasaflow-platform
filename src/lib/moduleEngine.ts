import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

export type ModuleId =
  | 'news'
  | 'events'
  | 'calendar'
  | 'contact'
  | 'about'
  | 'documents'
  | 'donation'
  | 'push'
  | 'prayer'
  | 'jumuah'
  | 'ramadan'
  | 'eid'
  | 'kurban'
  | 'ayet'
  | 'hadis'
  | 'dua'
  | 'qibla'
  | 'islamic-calendar'
  | 'sohbet'
  | 'courses'
  | 'quran-education'
  | 'kids-youth'
  | 'video-archive'
  | string;

export type ModuleState = Record<string, boolean>;

export const DEFAULT_MODULES: ModuleState = {
  news: true,
  events: true,
  contact: true,
  donation: true,
  push: true,
  prayer: true,
  sohbet: true,
  ramadan: true,
  kurban: true,
  ayet: true,
  hadis: true,
};

export function isModuleEnabled(modules: ModuleState, moduleId: ModuleId, fallback = true) {
  return modules[moduleId] ?? fallback;
}

export async function loadOrganizationModules(organizationId = 'dtim') {
  const client = supabase;
  if (!client) return DEFAULT_MODULES;

  const { data, error } = await client
    .from('organization_modules')
    .select('module_id, enabled')
    .eq('organization_id', organizationId);

  if (error) {
    console.warn('Kunne ikke hente modulstatus:', error.message);
    return DEFAULT_MODULES;
  }

  const modules: ModuleState = { ...DEFAULT_MODULES };
  for (const row of data || []) {
    modules[row.module_id] = Boolean(row.enabled);
  }

  return modules;
}

export function useOrganizationModules(organizationId = 'dtim') {
  const [modules, setModules] = useState<ModuleState>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      const next = await loadOrganizationModules(organizationId);
      if (!alive) return;
      setModules(next);
      setLoading(false);
    }

    void load();

    return () => {
      alive = false;
    };
  }, [organizationId]);

  return useMemo(
    () => ({
      modules,
      loading,
      enabled: (moduleId: ModuleId, fallback = true) => isModuleEnabled(modules, moduleId, fallback),
    }),
    [modules, loading],
  );
}
