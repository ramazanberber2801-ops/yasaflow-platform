import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { DEFAULT_ORGANIZATION_ID } from './organization';

export type ModuleId =
  | 'news'
  | 'activities'
  | 'members'
  | 'administration'
  | 'settings'
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
  | 'daily_inspiration'
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
  activities: true,
  members: true,
  administration: true,
  settings: true,
  contact: true,
  donation: true,
  push: false,
  prayer: false,
  sohbet: false,
  ramadan: false,
  kurban: false,
  daily_inspiration: false,
  ayet: false,
  hadis: false,
};

export function isModuleEnabled(modules: ModuleState, moduleId: ModuleId, fallback = false) {
  return modules[moduleId] ?? fallback;
}

export async function loadOrganizationModules(organizationId = DEFAULT_ORGANIZATION_ID) {
  if (!supabase) return DEFAULT_MODULES;

  const { data, error } = await supabase
    .from('organization_modules')
    .select('module_id, enabled')
    .eq('organization_id', organizationId);

  if (error) {
    console.warn('Kunne ikke hente modulstatus:', error.message);
    return DEFAULT_MODULES;
  }

  const modules: ModuleState = { ...DEFAULT_MODULES };
  for (const row of data || []) modules[row.module_id] = Boolean(row.enabled);
  return modules;
}

export function notifyOrganizationModulesChanged(organizationId: string) {
  window.dispatchEvent(new CustomEvent('yasaflow-modules-changed', { detail: { organizationId } }));
}

export function useOrganizationModules(organizationId = DEFAULT_ORGANIZATION_ID) {
  const [modules, setModules] = useState<ModuleState>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await loadOrganizationModules(organizationId);
    setModules(next);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadOrganizationModules(organizationId).then((next) => {
      if (!alive) return;
      setModules(next);
      setLoading(false);
    });

    const handleChanged = (event: Event) => {
      const changedOrganizationId = (event as CustomEvent<{ organizationId?: string }>).detail?.organizationId;
      if (!changedOrganizationId || changedOrganizationId === organizationId) void reload();
    };

    window.addEventListener('yasaflow-modules-changed', handleChanged);
    return () => {
      alive = false;
      window.removeEventListener('yasaflow-modules-changed', handleChanged);
    };
  }, [organizationId, reload]);

  return useMemo(() => ({
    modules,
    loading,
    reload,
    enabled: (moduleId: ModuleId, fallback = false) => isModuleEnabled(modules, moduleId, fallback),
  }), [modules, loading, reload]);
}
