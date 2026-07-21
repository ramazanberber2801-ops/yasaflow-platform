import { getCurrentOrganizationId } from './organization';
import { supabase } from './supabase';

type PushCopy = {
  missingKey: string;
  unsupportedDevice: string;
  unsupportedBrowser: string;
  permissionDenied: string;
  noConnection: string;
  saveFailed: string;
  enabled: string;
};

const pushCopy: Record<string, PushCopy> = {
  nb: {
    missingKey: 'Push-nøkkel mangler.',
    unsupportedDevice: 'Denne enheten støtter ikke push-varsler.',
    unsupportedBrowser: 'Denne nettleseren støtter ikke push-varsler.',
    permissionDenied: 'Tillatelse til varsler ble ikke gitt.',
    noConnection: 'Ingen forbindelse til systemet.',
    saveFailed: 'Varslene kunne ikke aktiveres.',
    enabled: 'Varsler er aktivert.',
  },
  da: {
    missingKey: 'Push-nøglen mangler.',
    unsupportedDevice: 'Denne enhed understøtter ikke push-notifikationer.',
    unsupportedBrowser: 'Denne browser understøtter ikke push-notifikationer.',
    permissionDenied: 'Tilladelse til notifikationer blev ikke givet.',
    noConnection: 'Ingen forbindelse til systemet.',
    saveFailed: 'Notifikationerne kunne ikke aktiveres.',
    enabled: 'Notifikationer er aktiveret.',
  },
  en: {
    missingKey: 'The push notification key is missing.',
    unsupportedDevice: 'This device does not support push notifications.',
    unsupportedBrowser: 'This browser does not support push notifications.',
    permissionDenied: 'Notification permission was not granted.',
    noConnection: 'The system connection is unavailable.',
    saveFailed: 'Notifications could not be enabled.',
    enabled: 'Notifications are enabled.',
  },
  tr: {
    missingKey: 'Push bildirim anahtarı eksik.',
    unsupportedDevice: 'Bu cihaz push bildirimlerini desteklemiyor.',
    unsupportedBrowser: 'Bu tarayıcı push bildirimlerini desteklemiyor.',
    permissionDenied: 'Bildirim izni verilmedi.',
    noConnection: 'Sistem bağlantısı kullanılamıyor.',
    saveFailed: 'Bildirimler etkinleştirilemedi.',
    enabled: 'Bildirimler etkinleştirildi.',
  },
  ar: {
    missingKey: 'مفتاح الإشعارات غير متوفر.',
    unsupportedDevice: 'هذا الجهاز لا يدعم الإشعارات الفورية.',
    unsupportedBrowser: 'هذا المتصفح لا يدعم الإشعارات الفورية.',
    permissionDenied: 'لم يتم منح إذن الإشعارات.',
    noConnection: 'الاتصال بالنظام غير متاح.',
    saveFailed: 'تعذر تفعيل الإشعارات.',
    enabled: 'تم تفعيل الإشعارات.',
  },
  ur: {
    missingKey: 'پش نوٹیفکیشن کلید موجود نہیں ہے۔',
    unsupportedDevice: 'یہ ڈیوائس پش نوٹیفکیشنز کو سپورٹ نہیں کرتی۔',
    unsupportedBrowser: 'یہ براؤزر پش نوٹیفکیشنز کو سپورٹ نہیں کرتا۔',
    permissionDenied: 'نوٹیفکیشن کی اجازت نہیں دی گئی۔',
    noConnection: 'سسٹم سے رابطہ دستیاب نہیں ہے۔',
    saveFailed: 'نوٹیفکیشنز فعال نہیں کیے جا سکے۔',
    enabled: 'نوٹیفکیشنز فعال کر دیے گئے ہیں۔',
  },
};

function getPushCopy() {
  const language = (document.documentElement.lang || navigator.language || 'nb').toLowerCase().split('-')[0];
  return pushCopy[language] || pushCopy.nb;
}

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
  const copy = getPushCopy();
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) { alert(copy.missingKey); return false; }
  if (!('serviceWorker' in navigator)) { alert(copy.unsupportedDevice); return false; }
  if (!('PushManager' in window)) { alert(copy.unsupportedBrowser); return false; }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { alert(copy.permissionDenied); return false; }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription = existingSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    if (!supabase) { alert(copy.noConnection); return false; }

    const subscriptionJson = subscription.toJSON();
    const subscriptionId = btoa(subscription.endpoint).slice(0, 120);
    const { error } = await supabase.rpc('register_push_subscription', {
      subscription_id_input: subscriptionId,
      organization_id_input: resolveOrganizationId(organizationId),
      endpoint_input: subscription.endpoint,
      subscription_input: subscriptionJson,
    });

    if (error) {
      console.error('Push subscription registration failed:', error);
      alert(copy.saveFailed);
      return false;
    }

    alert(copy.enabled);
    return true;
  } catch (error) {
    console.error('Push subscription failed:', error);
    alert(copy.saveFailed);
    return false;
  }
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
  return result as { ok: boolean; sent: number; failed: number; removed: number; message_id: string; organization_id: string };
}
