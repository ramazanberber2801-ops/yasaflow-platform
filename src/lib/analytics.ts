import { supabase } from './supabase';

const DEFAULT_ORGANIZATION_ID = import.meta.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

function resolveOrganizationId() {
  try {
    const saved = localStorage.getItem('dtim_admin');
    const admin = saved ? JSON.parse(saved) : null;
    return admin?.organization_id || DEFAULT_ORGANIZATION_ID;
  } catch {
    return DEFAULT_ORGANIZATION_ID;
  }
}

export async function trackEvent(eventType: string, itemId?: string, itemTitle?: string) {
  try {
    if (!supabase) return;
    await supabase.from('analytics_events').insert([{
      organization_id: resolveOrganizationId(),
      event_type: eventType,
      item_id: itemId || null,
      item_title: itemTitle || null,
    }]);
  } catch {
    // Ikke stopp appen hvis statistikk feiler
  }
}
