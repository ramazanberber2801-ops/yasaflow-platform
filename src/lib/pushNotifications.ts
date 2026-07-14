import { getCurrentOrganizationId } from './organization';
import { supabase } from './supabase';

function resolveOrganizationId(explicit?: string) {
  return explicit?.trim() || getCurrentOrganizationId();
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function subscribeToPushNotifications(organizationId?: string) {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) { alert('Push public key mangler.'); return false; }
  if (!('serviceWorker' in navigator)) { alert('Bu cihaz bildirimleri desteklemiyor.'); return false; }
  if (!('PushManager' in window)) { alert('Bu tarayıcı push bildirimlerini desteklemiyor.'); return false; }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') { alert('Bildirim izni verilmedi.'); return false; }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  if (!supabase) { alert('Sistem bağlantısı yok.'); return false; }

  const subscriptionJson = subscription.toJSON();
  const subscriptionId = btoa(subscription.endpoint).slice(0, 120);
  const { error } = await supabase.rpc('register_push_subscription', {
    subscription_id_input: subscriptionId,
    organization_id_input: resolveOrganizationId(organizationId),
    endpoint_input: subscription.endpoint,
    subscription_input: subscriptionJson,
  });

  if (error) { alert('Bildirim kaydedilemedi: ' + error.message); return false; }
  alert('Bildirimler açıldı.');
  return true;
}

export async function sendPushNotification(input: { title: string; body: string; url?: string; organizationId?: string }) {
  if (!supabase) throw new Error('Sistemtilkoblingen er ikke tilgjengelig.');

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) throw new Error('Du må være innlogget som administrator for å sende varsler.');

  const response = await fetch('/api/send-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      title: input.title.trim(),
      body: input.body.trim(),
      url: input.url,
      organizationId: resolveOrganizationId(input.organizationId),
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || 'Push-varselet kunne ikke sendes.');
  return result as { ok: boolean; sent: number; failed: number; message_id: string; organization_id: string };
}
