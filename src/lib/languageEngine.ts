import { useMemo, useState } from 'react';

export type LanguageCode = 'no' | 'tr' | 'en' | string;
export type TranslationKey = string;
export type TranslationTable = Record<TranslationKey, string>;
export type TranslationCatalog = Record<LanguageCode, TranslationTable>;

export const SUPPORTED_LANGUAGES = [
  { code: 'no', name: 'Norsk', nativeName: 'Norsk' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', nativeName: 'English' },
] as const;

export const DEFAULT_LANGUAGE: LanguageCode = 'tr';
export const FALLBACK_LANGUAGE: LanguageCode = 'tr';

export const translations: TranslationCatalog = {
  no: {
    'nav.home': 'Hjem',
    'nav.donation': 'Donasjon',
    'nav.contact': 'Kontakt',
    'app.loading': 'Laster...',
    'auth.recovery.title': 'Angi nytt passord',
    'auth.recovery.password': 'Nytt passord',
    'auth.recovery.passwordRepeat': 'Gjenta nytt passord',
    'auth.recovery.showPassword': 'Vis passord',
    'auth.recovery.save': 'Lagre',
    'auth.recovery.saving': 'Lagrer...',
    'auth.recovery.success': 'Lagret. Du kan logge inn med nytt passord.',
    'module.news': 'Nyheter',
    'module.events': 'Arrangementer',
    'module.contact': 'Kontakt',
    'module.donation': 'Donasjon',
    'module.prayer': 'Bønnetider',
    'module.sohbet': 'Sohbet',
    'module.ramadan': 'Ramadan',
    'module.kurban': 'Kurban',
    'module.ayet': 'Ayet',
    'module.hadis': 'Hadis',
  },
  tr: {
    'nav.home': 'Ana Sayfa',
    'nav.donation': 'Bağış',
    'nav.contact': 'İletişim',
    'app.loading': 'Yükleniyor...',
    'auth.recovery.title': 'Yeni Şifre Belirle',
    'auth.recovery.password': 'Yeni şifre',
    'auth.recovery.passwordRepeat': 'Yeni şifre tekrar',
    'auth.recovery.showPassword': 'Şifreyi göster',
    'auth.recovery.save': 'Kaydet',
    'auth.recovery.saving': 'Kaydediliyor...',
    'auth.recovery.success': 'Kaydedildi. Yeni şifreyle giriş yapabilirsiniz.',
    'module.news': 'Duyurular ve Haberler',
    'module.events': 'Etkinlikler',
    'module.contact': 'İletişim',
    'module.donation': 'Bağış',
    'module.prayer': 'Namaz Vakitleri',
    'module.sohbet': 'Sohbet / Ders',
    'module.ramadan': 'Ramazan',
    'module.kurban': 'Kurban',
    'module.ayet': 'Ayet',
    'module.hadis': 'Hadis',
  },
  en: {
    'nav.home': 'Home',
    'nav.donation': 'Donate',
    'nav.contact': 'Contact',
    'app.loading': 'Loading...',
    'auth.recovery.title': 'Set New Password',
    'auth.recovery.password': 'New password',
    'auth.recovery.passwordRepeat': 'Repeat new password',
    'auth.recovery.showPassword': 'Show password',
    'auth.recovery.save': 'Save',
    'auth.recovery.saving': 'Saving...',
    'auth.recovery.success': 'Saved. You can sign in with your new password.',
    'module.news': 'News',
    'module.events': 'Events',
    'module.contact': 'Contact',
    'module.donation': 'Donation',
    'module.prayer': 'Prayer Times',
    'module.sohbet': 'Talks / Lessons',
    'module.ramadan': 'Ramadan',
    'module.kurban': 'Qurbani',
    'module.ayet': 'Verse',
    'module.hadis': 'Hadith',
  },
};

export function translate(key: TranslationKey, language: LanguageCode = DEFAULT_LANGUAGE, fallbackText?: string) {
  return translations[language]?.[key]
    || translations[FALLBACK_LANGUAGE]?.[key]
    || translations.no?.[key]
    || fallbackText
    || key;
}

export function useLanguage(initialLanguage: LanguageCode = DEFAULT_LANGUAGE) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);

  return useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey, fallbackText?: string) => translate(key, language, fallbackText),
    }),
    [language],
  );
}
