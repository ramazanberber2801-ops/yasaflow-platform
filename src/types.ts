export type Page = 'home' | 'contact';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageBase64?: string;
  date: string;
  category: string;
}

export interface StaffMember {
  id: string;
  name: string;
  position: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  whatsappNumber?: string;
  bio?: string;
  description?: string;
  imageUrl?: string;
  photoUrl?: string;
}

export interface SohbetItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  imageBase64?: string;
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerData {
  timings: PrayerTimings;
  hijriDate: string;
  gregorianDate: string;
  timezone?: string;
}

export interface QuranEntry {
  arabic: string;
  turkish: string;
  reference: string;
  type: 'verse' | 'hadith';
}

export interface DailyInspiration {
  verseText: string;
  verseReference: string;
  hadithText: string;
  hadithSource: string;
  published: boolean;
}

export interface MosqueSettings {
  mosqueName: string;
  shortName: string;
  vippsNumber: string;
  address: string;
  mapUrl: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  bankAccount: string;
  iban: string;
  openingHours: string;
  fridayPrayer: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: 'superadmin' | 'admin';
}
