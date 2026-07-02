import { supabase } from './supabase';

export async function trackEvent(
  eventType: string,
  itemId?: string,
  itemTitle?: string
) {
  try {
    if (!supabase) return;

    await supabase.from('analytics_events').insert([
      {
        event_type: eventType,
        item_id: itemId || null,
        item_title: itemTitle || null,
      },
    ]);
  } catch {
    // Ikke stopp appen hvis statistikk feiler
  }
}
