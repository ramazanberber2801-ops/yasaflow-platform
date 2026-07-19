export type SupportedNotificationLanguage = 'nb' | 'en' | 'da' | 'tr' | 'ar' | 'ur' | 'de' | 'fr';

type NotificationTranslations = {
  title: string;
  description: string;
  enableButton: string;
  disableButton: string;
  processing: string;
  disabledSuccess: string;
  disabledError: string;
};

const translations: Record<SupportedNotificationLanguage, NotificationTranslations> = {
  nb: {
    title: 'Varsler',
    description: 'Aktiver varsler for å motta de nyeste nyhetene, aktivitetene og viktige kunngjøringene.',
    enableButton: 'Aktiver varsler',
    disableButton: 'Deaktiver varsler',
    processing: 'Behandler...',
    disabledSuccess: 'Varsler er deaktivert.',
    disabledError: 'Varslene kunne ikke deaktiveres.',
  },
  en: {
    title: 'Notifications',
    description: 'Enable notifications to receive the latest news, events, and important announcements.',
    enableButton: 'Enable notifications',
    disableButton: 'Disable notifications',
    processing: 'Processing...',
    disabledSuccess: 'Notifications have been disabled.',
    disabledError: 'Notifications could not be disabled.',
  },
  da: {
    title: 'Notifikationer',
    description: 'Aktivér notifikationer for at modtage de seneste nyheder, aktiviteter og vigtige meddelelser.',
    enableButton: 'Aktivér notifikationer',
    disableButton: 'Deaktivér notifikationer',
    processing: 'Behandler...',
    disabledSuccess: 'Notifikationer er deaktiveret.',
    disabledError: 'Notifikationerne kunne ikke deaktiveres.',
  },
  tr: {
    title: 'Bildirimler',
    description: 'Güncel haberler, etkinlikler ve önemli duyurular için bildirimleri etkinleştirin.',
    enableButton: 'Bildirimleri Aç',
    disableButton: 'Bildirimleri Kapat',
    processing: 'İşleniyor...',
    disabledSuccess: 'Bildirimler kapatıldı.',
    disabledError: 'Bildirimler kapatılamadı.',
  },
  ar: {
    title: 'الإشعارات',
    description: 'فعّل الإشعارات لتصلك أحدث الأخبار والفعاليات والإعلانات المهمة.',
    enableButton: 'تفعيل الإشعارات',
    disableButton: 'إيقاف الإشعارات',
    processing: 'جارٍ المعالجة...',
    disabledSuccess: 'تم إيقاف الإشعارات.',
    disabledError: 'تعذر إيقاف الإشعارات.',
  },
  ur: {
    title: 'اطلاعات',
    description: 'تازہ ترین خبریں، سرگرمیاں اور اہم اعلانات حاصل کرنے کے لیے اطلاعات فعال کریں۔',
    enableButton: 'اطلاعات فعال کریں',
    disableButton: 'اطلاعات بند کریں',
    processing: 'عمل جاری ہے...',
    disabledSuccess: 'اطلاعات بند کر دی گئی ہیں۔',
    disabledError: 'اطلاعات بند نہیں کی جا سکیں۔',
  },
  de: {
    title: 'Benachrichtigungen',
    description: 'Aktivieren Sie Benachrichtigungen, um aktuelle Nachrichten, Veranstaltungen und wichtige Mitteilungen zu erhalten.',
    enableButton: 'Benachrichtigungen aktivieren',
    disableButton: 'Benachrichtigungen deaktivieren',
    processing: 'Wird verarbeitet...',
    disabledSuccess: 'Benachrichtigungen wurden deaktiviert.',
    disabledError: 'Benachrichtigungen konnten nicht deaktiviert werden.',
  },
  fr: {
    title: 'Notifications',
    description: 'Activez les notifications pour recevoir les dernières actualités, les événements et les annonces importantes.',
    enableButton: 'Activer les notifications',
    disableButton: 'Désactiver les notifications',
    processing: 'Traitement en cours...',
    disabledSuccess: 'Les notifications ont été désactivées.',
    disabledError: 'Impossible de désactiver les notifications.',
  },
};

const aliases: Record<string, SupportedNotificationLanguage> = {
  no: 'nb',
  nb: 'nb',
  nn: 'nb',
  en: 'en',
  da: 'da',
  tr: 'tr',
  ar: 'ar',
  ur: 'ur',
  de: 'de',
  fr: 'fr',
};

export function resolveNotificationLanguage(language?: string | null): SupportedNotificationLanguage {
  const requested = String(
    language ||
      document.documentElement.lang ||
      localStorage.getItem('yasaflow_language') ||
      navigator.language ||
      'tr',
  )
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];

  return aliases[requested] || 'en';
}

export function getNotificationTranslations(language?: string | null): NotificationTranslations {
  return translations[resolveNotificationLanguage(language)];
}

export function isRtlNotificationLanguage(language?: string | null) {
  const resolved = resolveNotificationLanguage(language);
  return resolved === 'ar' || resolved === 'ur';
}
