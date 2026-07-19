export type AppUiLanguage = 'nb' | 'en' | 'da' | 'tr' | 'ar' | 'ur';

type BottomNavCopy = { home: string; activities: string; calendar: string; more: string };
type MorePageCopy = {
  more: string; organization: string; admin: string; visitor: string; notifications: string;
  contact: string; documents: string; members: string; donations: string; payments: string;
  chat: string; administration: string; login: string; settings: string;
};
type CalendarCopy = {
  title: string; empty: string; today: string; activities: string;
  previousMonth: string; nextMonth: string; eventCount: (count: number) => string;
};
type AdminShellCopy = {
  title: string; owner: string; administrator: string; logout: string; close: string;
  ownerPanel: string; administratorPortal: string;
};

const bottomNav: Record<AppUiLanguage, BottomNavCopy> = {
  nb: { home: 'Hjem', activities: 'Aktiviteter', calendar: 'Kalender', more: 'Mer' },
  en: { home: 'Home', activities: 'Activities', calendar: 'Calendar', more: 'More' },
  da: { home: 'Hjem', activities: 'Aktiviteter', calendar: 'Kalender', more: 'Mere' },
  tr: { home: 'Ana sayfa', activities: 'Etkinlikler', calendar: 'Takvim', more: 'Daha fazla' },
  ar: { home: 'الرئيسية', activities: 'الأنشطة', calendar: 'التقويم', more: 'المزيد' },
  ur: { home: 'ہوم', activities: 'سرگرمیاں', calendar: 'کیلنڈر', more: 'مزید' },
};

const morePage: Record<AppUiLanguage, MorePageCopy> = {
  nb: { more: 'Mer', organization: 'Min organisasjon', admin: 'Administrator', visitor: 'Medlem eller besøkende', notifications: 'Varsler', contact: 'Kontakt', documents: 'Dokumenter', members: 'Medlemmer', donations: 'Eksterne betalingslenker', payments: 'Betalinger', chat: 'Chat', administration: 'Administrasjon', login: 'Logg inn', settings: 'Innstillinger og moduler' },
  en: { more: 'More', organization: 'My organization', admin: 'Administrator', visitor: 'Member or visitor', notifications: 'Notifications', contact: 'Contact', documents: 'Documents', members: 'Members', donations: 'External payment links', payments: 'Payments', chat: 'Chat', administration: 'Administration', login: 'Sign in', settings: 'Settings and modules' },
  da: { more: 'Mere', organization: 'Min organisation', admin: 'Administrator', visitor: 'Medlem eller besøgende', notifications: 'Notifikationer', contact: 'Kontakt', documents: 'Dokumenter', members: 'Medlemmer', donations: 'Eksterne betalingslinks', payments: 'Betalinger', chat: 'Chat', administration: 'Administration', login: 'Log ind', settings: 'Indstillinger og moduler' },
  tr: { more: 'Daha fazla', organization: 'Kuruluşum', admin: 'Yönetici', visitor: 'Üye veya ziyaretçi', notifications: 'Bildirimler', contact: 'İletişim', documents: 'Belgeler', members: 'Üyeler', donations: 'Harici ödeme bağlantıları', payments: 'Ödemeler', chat: 'Sohbet', administration: 'Yönetim', login: 'Giriş yap', settings: 'Ayarlar ve modüller' },
  ar: { more: 'المزيد', organization: 'مؤسستي', admin: 'مسؤول', visitor: 'عضو أو زائر', notifications: 'الإشعارات', contact: 'اتصل بنا', documents: 'المستندات', members: 'الأعضاء', donations: 'روابط دفع خارجية', payments: 'المدفوعات', chat: 'الدردشة', administration: 'الإدارة', login: 'تسجيل الدخول', settings: 'الإعدادات والوحدات' },
  ur: { more: 'مزید', organization: 'میری تنظیم', admin: 'ایڈمن', visitor: 'رکن یا وزیٹر', notifications: 'اطلاعات', contact: 'رابطہ', documents: 'دستاویزات', members: 'ارکان', donations: 'بیرونی ادائیگی لنکس', payments: 'ادائیگیاں', chat: 'چیٹ', administration: 'انتظامیہ', login: 'لاگ اِن', settings: 'ترتیبات اور ماڈیولز' },
};

const calendar: Record<AppUiLanguage, CalendarCopy> = {
  nb: { title: 'Kalender', empty: 'Ingen aktiviteter denne dagen.', today: 'I dag', activities: 'Aktiviteter', previousMonth: 'Forrige måned', nextMonth: 'Neste måned', eventCount: count => `${count} aktiviteter` },
  en: { title: 'Calendar', empty: 'No activities on this day.', today: 'Today', activities: 'Activities', previousMonth: 'Previous month', nextMonth: 'Next month', eventCount: count => `${count} activities` },
  da: { title: 'Kalender', empty: 'Ingen aktiviteter denne dag.', today: 'I dag', activities: 'Aktiviteter', previousMonth: 'Forrige måned', nextMonth: 'Næste måned', eventCount: count => `${count} aktiviteter` },
  tr: { title: 'Takvim', empty: 'Bu gün için etkinlik yok.', today: 'Bugün', activities: 'Etkinlikler', previousMonth: 'Önceki ay', nextMonth: 'Sonraki ay', eventCount: count => `${count} etkinlik` },
  ar: { title: 'التقويم', empty: 'لا توجد أنشطة في هذا اليوم.', today: 'اليوم', activities: 'الأنشطة', previousMonth: 'الشهر السابق', nextMonth: 'الشهر التالي', eventCount: count => `${count} أنشطة` },
  ur: { title: 'کیلنڈر', empty: 'اس دن کوئی سرگرمی نہیں ہے۔', today: 'آج', activities: 'سرگرمیاں', previousMonth: 'پچھلا مہینہ', nextMonth: 'اگلا مہینہ', eventCount: count => `${count} سرگرمیاں` },
};

const adminShell: Record<AppUiLanguage, AdminShellCopy> = {
  nb: { title: 'Yasaflow-administrasjon', owner: 'Eier', administrator: 'Administrator', logout: 'Logg ut', close: 'Lukk administrasjonspanelet', ownerPanel: 'Eierpanel', administratorPortal: 'Administratorportal' },
  en: { title: 'Yasaflow administration', owner: 'Owner', administrator: 'Administrator', logout: 'Sign out', close: 'Close administration panel', ownerPanel: 'Owner panel', administratorPortal: 'Administrator portal' },
  da: { title: 'Yasaflow-administration', owner: 'Ejer', administrator: 'Administrator', logout: 'Log ud', close: 'Luk administrationspanelet', ownerPanel: 'Ejerpanel', administratorPortal: 'Administratorportal' },
  tr: { title: 'Yasaflow yönetimi', owner: 'Sahip', administrator: 'Yönetici', logout: 'Çıkış yap', close: 'Yönetim panelini kapat', ownerPanel: 'Sahip paneli', administratorPortal: 'Yönetici portalı' },
  ar: { title: 'إدارة Yasaflow', owner: 'المالك', administrator: 'المسؤول', logout: 'تسجيل الخروج', close: 'إغلاق لوحة الإدارة', ownerPanel: 'لوحة المالك', administratorPortal: 'بوابة المسؤول' },
  ur: { title: 'Yasaflow انتظامیہ', owner: 'مالک', administrator: 'ایڈمن', logout: 'لاگ آؤٹ', close: 'انتظامی پینل بند کریں', ownerPanel: 'مالک پینل', administratorPortal: 'ایڈمن پورٹل' },
};

function normalizeLanguage(language: string): AppUiLanguage {
  return language in bottomNav ? language as AppUiLanguage : 'en';
}

export function getBottomNavCopy(language: string): BottomNavCopy { return bottomNav[normalizeLanguage(language)]; }
export function getMorePageCopy(language: string): MorePageCopy { return morePage[normalizeLanguage(language)]; }
export function getCalendarCopy(language: string): CalendarCopy { return calendar[normalizeLanguage(language)]; }
export function getActivitiesTitle(language: string): string { return bottomNav[normalizeLanguage(language)].activities; }
export function getAdminShellCopy(language: string): AdminShellCopy { return adminShell[normalizeLanguage(language)]; }
