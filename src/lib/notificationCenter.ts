import { supabase } from './supabase';

export type PushMessage = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  expires_at: string;
  organization_id: string;
};

const READ_KEY = 'yasaflow-read-push-messages';

function readIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isPushMessageRead(id: string) {
  return readIds().includes(id);
}

export function markPushMessageRead(id: string) {
  const next = Array.from(new Set([...readIds(), id]));
  localStorage.setItem(READ_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('yasaflow-notifications-read'));
}

export function clearExpiredReadIds(activeIds: string[]) {
  const active = new Set(activeIds);
  const next = readIds().filter((id) => active.has(id));
  localStorage.setItem(READ_KEY, JSON.stringify(next));
}

export async function loadActivePushMessages(organizationId: string) {
  if (!supabase) return [] as PushMessage[];
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('push_messages')
    .select('id,title,body,created_at,expires_at,organization_id')
    .eq('organization_id', organizationId)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const messages = (data || []) as PushMessage[];
  clearExpiredReadIds(messages.map((message) => message.id));
  return messages;
}
