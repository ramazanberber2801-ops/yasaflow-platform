type Dictionary = Record<string, string>;

const nb: Dictionary = {
  announcement: 'Kunngjøring',
  loadOrganizationData: 'Kunne ikke laste organisasjonsdata:',
  newsCreate: 'Nyheten kunne ikke opprettes:', newsCreatedPush: 'En ny nyhet er publisert', newsPushTitle: 'Nyhet',
  newsUpdate: 'Nyheten kunne ikke oppdateres:', newsUpdatedPush: 'Nyheten er oppdatert', newsDelete: 'Nyheten kunne ikke slettes:',
  staffCreate: 'Kontaktpersonen kunne ikke opprettes:', staffUpdate: 'Kontaktpersonen kunne ikke oppdateres:', staffDelete: 'Kontaktpersonen kunne ikke slettes:',
  activityCreate: 'Aktiviteten kunne ikke opprettes:', activityNewPush: 'Ny aktivitet', activityUpdate: 'Aktiviteten kunne ikke oppdateres:', activityUpdatedPush: 'Aktiviteten er oppdatert', activityDelete: 'Aktiviteten kunne ikke slettes:',
  settingsSave: 'Innstillingene kunne ikke lagres:', inspirationUpdate: 'Teksten kunne ikke oppdateres:',
  adminCreate: 'Administratoren kunne ikke opprettes:', adminDelete: 'Administratoren kunne ikke slettes:', passwordUpdate: 'Passordet kunne ikke oppdateres:',
  providerError: 'useApp må brukes inne i AppProvider',
};

const en: Dictionary = {
  announcement: 'Announcement',
  loadOrganizationData: 'Organization data could not be loaded:',
  newsCreate: 'The news item could not be created:', newsCreatedPush: 'A new news item has been published', newsPushTitle: 'News',
  newsUpdate: 'The news item could not be updated:', newsUpdatedPush: 'The news item has been updated', newsDelete: 'The news item could not be deleted:',
  staffCreate: 'The contact could not be created:', staffUpdate: 'The contact could not be updated:', staffDelete: 'The contact could not be deleted:',
  activityCreate: 'The activity could not be created:', activityNewPush: 'New activity', activityUpdate: 'The activity could not be updated:', activityUpdatedPush: 'The activity has been updated', activityDelete: 'The activity could not be deleted:',
  settingsSave: 'The settings could not be saved:', inspirationUpdate: 'The text could not be updated:',
  adminCreate: 'The administrator could not be created:', adminDelete: 'The administrator could not be deleted:', passwordUpdate: 'The password could not be updated:',
  providerError: 'useApp must be used inside AppProvider',
};

const tr: Dictionary = {
  announcement: 'Duyuru',
  loadOrganizationData: 'Kuruluş verileri yüklenemedi:',
  newsCreate: 'Haber oluşturulamadı:', newsCreatedPush: 'Yeni bir haber yayınlandı', newsPushTitle: 'Haber',
  newsUpdate: 'Haber güncellenemedi:', newsUpdatedPush: 'Haber güncellendi', newsDelete: 'Haber silinemedi:',
  staffCreate: 'İletişim kişisi oluşturulamadı:', staffUpdate: 'İletişim kişisi güncellenemedi:', staffDelete: 'İletişim kişisi silinemedi:',
  activityCreate: 'Etkinlik oluşturulamadı:', activityNewPush: 'Yeni etkinlik', activityUpdate: 'Etkinlik güncellenemedi:', activityUpdatedPush: 'Etkinlik güncellendi', activityDelete: 'Etkinlik silinemedi:',
  settingsSave: 'Ayarlar kaydedilemedi:', inspirationUpdate: 'Metin güncellenemedi:',
  adminCreate: 'Yönetici oluşturulamadı:', adminDelete: 'Yönetici silinemedi:', passwordUpdate: 'Şifre güncellenemedi:',
  providerError: 'useApp, AppProvider içinde kullanılmalıdır',
};

const ar: Dictionary = {
  announcement: 'إعلان', loadOrganizationData: 'تعذر تحميل بيانات المؤسسة:',
  newsCreate: 'تعذر إنشاء الخبر:', newsCreatedPush: 'تم نشر خبر جديد', newsPushTitle: 'خبر', newsUpdate: 'تعذر تحديث الخبر:', newsUpdatedPush: 'تم تحديث الخبر', newsDelete: 'تعذر حذف الخبر:',
  staffCreate: 'تعذر إنشاء جهة الاتصال:', staffUpdate: 'تعذر تحديث جهة الاتصال:', staffDelete: 'تعذر حذف جهة الاتصال:',
  activityCreate: 'تعذر إنشاء النشاط:', activityNewPush: 'نشاط جديد', activityUpdate: 'تعذر تحديث النشاط:', activityUpdatedPush: 'تم تحديث النشاط', activityDelete: 'تعذر حذف النشاط:',
  settingsSave: 'تعذر حفظ الإعدادات:', inspirationUpdate: 'تعذر تحديث النص:', adminCreate: 'تعذر إنشاء المسؤول:', adminDelete: 'تعذر حذف المسؤول:', passwordUpdate: 'تعذر تحديث كلمة المرور:', providerError: 'يجب استخدام useApp داخل AppProvider',
};

const ur: Dictionary = {
  announcement: 'اعلان', loadOrganizationData: 'تنظیم کا ڈیٹا لوڈ نہیں ہو سکا:',
  newsCreate: 'خبر بنائی نہیں جا سکی:', newsCreatedPush: 'نئی خبر شائع ہو گئی ہے', newsPushTitle: 'خبر', newsUpdate: 'خبر اپ ڈیٹ نہیں ہو سکی:', newsUpdatedPush: 'خبر اپ ڈیٹ ہو گئی ہے', newsDelete: 'خبر حذف نہیں ہو سکی:',
  staffCreate: 'رابطہ شخص نہیں بنایا جا سکا:', staffUpdate: 'رابطہ شخص اپ ڈیٹ نہیں ہو سکا:', staffDelete: 'رابطہ شخص حذف نہیں ہو سکا:',
  activityCreate: 'سرگرمی نہیں بنائی جا سکی:', activityNewPush: 'نئی سرگرمی', activityUpdate: 'سرگرمی اپ ڈیٹ نہیں ہو سکی:', activityUpdatedPush: 'سرگرمی اپ ڈیٹ ہو گئی ہے', activityDelete: 'سرگرمی حذف نہیں ہو سکی:',
  settingsSave: 'ترتیبات محفوظ نہیں ہو سکیں:', inspirationUpdate: 'متن اپ ڈیٹ نہیں ہو سکا:', adminCreate: 'ایڈمن نہیں بنایا جا سکا:', adminDelete: 'ایڈمن حذف نہیں ہو سکا:', passwordUpdate: 'پاس ورڈ اپ ڈیٹ نہیں ہو سکا:', providerError: 'useApp کو AppProvider کے اندر استعمال کرنا ضروری ہے',
};

const dictionaries: Record<string, Dictionary> = { nb, en, tr, ar, ur };

export function getSystemTranslation(language: string, key: string): string {
  return dictionaries[language]?.[key] || en[key] || nb[key] || key;
}
