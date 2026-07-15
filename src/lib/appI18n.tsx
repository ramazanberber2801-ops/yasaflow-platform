import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { findLanguage } from './languageRegistry';
import { DEFAULT_ORGANIZATION_ID } from './organization';
import { supabase } from './supabase';

type Dictionary = Record<string, string>;

const nb: Dictionary = {
  'nav.home':'Hjem','nav.donation':'Donasjon','nav.contact':'Kontakt',
  'contact.title':'Kontakt','contact.subtitle':'Ta kontakt med oss','contact.location':'FYSISK ADRESSE','contact.address':'Organisasjonens adresse','contact.directions':'FINN FREM','contact.askTitle':'Still et spørsmål','contact.askSubtitle':'Send spørsmålet ditt via WhatsApp','contact.askBody':'Har du spørsmål? Kontakt organisasjonen via WhatsApp, så hjelper vi deg så snart som mulig.','contact.askButton':'SPØR VIA WHATSAPP','contact.staff':'Våre kontaktpersoner','contact.noStaff':'Ingen kontaktpersoner er registrert ennå.','contact.call':'Ring',
  'home.changeCity':'Endre by','home.searchCity':'Søk etter by...','home.useLocation':'Bruk min posisjon','home.nextPrayer':'Neste','home.loadingPrayer':'Henter bønnetider...','home.todayProgram':'Dagens program','home.upcomingActivities':'Kommende aktiviteter','home.noUpcomingActivities':'Ingen kommende aktiviteter.','home.news':'Nyheter','home.noNews':'Ingen nyheter ennå.',
  'install.title':'Installer appen','install.description':'Legg den til på startskjermen for rask tilgang','install.button':'Installer','install.close':'Lukk',
  'common.loading':'Laster...','common.close':'Lukk','common.save':'Lagre','common.saving':'Lagrer...',
  'recovery.title':'Velg nytt passord','recovery.password':'Nytt passord','recovery.repeat':'Gjenta nytt passord','recovery.show':'Vis passord','recovery.tooShort':'Passordet må ha minst 6 tegn.','recovery.noMatch':'Passordene er ikke like.','recovery.noConnection':'Ingen forbindelse til systemet.','recovery.failed':'Passordet kunne ikke lagres: ','recovery.success':'Passordet er lagret. Du kan nå logge inn med det nye passordet.',
  'activity.label':'Aktivitet','activity.contact':'Kontaktperson','activity.addCalendar':'Legg til i kalender','activity.addReminder':'Legg til påminnelse','activity.call':'Ring','activity.sms':'SMS','activity.whatsapp':'WhatsApp','activity.email':'E-post'
};
const en: Dictionary = {
  'nav.home':'Home','nav.donation':'Donate','nav.contact':'Contact',
  'contact.title':'Contact','contact.subtitle':'Get in touch with us','contact.location':'PHYSICAL LOCATION','contact.address':'Organization address','contact.directions':'GET DIRECTIONS','contact.askTitle':'Ask a question','contact.askSubtitle':'Send your question via WhatsApp','contact.askBody':'Do you have a question? Contact the organization through WhatsApp and we will help as soon as possible.','contact.askButton':'ASK ON WHATSAPP','contact.staff':'Our contacts','contact.noStaff':'No contacts have been registered yet.','contact.call':'Call',
  'home.changeCity':'Change city','home.searchCity':'Search city...','home.useLocation':'Use my location','home.nextPrayer':'Next','home.loadingPrayer':'Loading prayer times...','home.todayProgram':'Today’s program','home.upcomingActivities':'Upcoming activities','home.noUpcomingActivities':'No upcoming activities.','home.news':'News','home.noNews':'No news yet.',
  'install.title':'Install the app','install.description':'Add it to your home screen for quick access','install.button':'Install','install.close':'Close',
  'common.loading':'Loading...','common.close':'Close','common.save':'Save','common.saving':'Saving...',
  'recovery.title':'Choose a new password','recovery.password':'New password','recovery.repeat':'Repeat new password','recovery.show':'Show password','recovery.tooShort':'The password must contain at least 6 characters.','recovery.noMatch':'The passwords do not match.','recovery.noConnection':'No connection to the system.','recovery.failed':'The password could not be saved: ','recovery.success':'The password has been saved. You can now sign in with the new password.',
  'activity.label':'Activity','activity.contact':'Contact person','activity.addCalendar':'Add to calendar','activity.addReminder':'Add reminder','activity.call':'Call','activity.sms':'SMS','activity.whatsapp':'WhatsApp','activity.email':'Email'
};
const tr: Dictionary = {
  'nav.home':'Ana Sayfa','nav.donation':'Bağış','nav.contact':'İletişim',
  'contact.title':'İletişim','contact.subtitle':'Bizimle iletişime geçin','contact.location':'FİZİKSEL KONUM','contact.address':'Dernek adresi','contact.directions':'YOL TARİFİ','contact.askTitle':'Soru Sor','contact.askSubtitle':'Sorunuzu WhatsApp üzerinden iletin','contact.askBody':'Sorunuz mu var? WhatsApp üzerinden kuruluşla iletişime geçebilirsiniz.','contact.askButton':'WHATSAPP İLE SOR','contact.staff':'İletişim kişilerimiz','contact.noStaff':'Henüz kayıtlı kişi yok.','contact.call':'Ara',
  'home.changeCity':'Şehir Değiştir','home.searchCity':'Şehir ara...','home.useLocation':'Konumumu kullan','home.nextPrayer':'Sıradaki','home.loadingPrayer':'Namaz vakitleri yükleniyor...','home.todayProgram':'Bugünkü program','home.upcomingActivities':'Yaklaşan aktiviteler','home.noUpcomingActivities':'Yaklaşan aktivite yok.','home.news':'Haberler','home.noNews':'Henüz haber yok.',
  'install.title':'Uygulamayı Yükle','install.description':'Ana ekrana ekleyin, hızlı erişin','install.button':'Yükle','install.close':'Kapat',
  'common.loading':'Yükleniyor...','common.close':'Kapat','common.save':'Kaydet','common.saving':'Kaydediliyor...',
  'recovery.title':'Yeni şifre belirle','recovery.password':'Yeni şifre','recovery.repeat':'Yeni şifre tekrar','recovery.show':'Şifreyi göster','recovery.tooShort':'Şifre en az 6 karakter olmalıdır.','recovery.noMatch':'Şifreler aynı değil.','recovery.noConnection':'Sistem bağlantısı yok.','recovery.failed':'Şifre kaydedilemedi: ','recovery.success':'Şifre kaydedildi. Yeni şifrenizle giriş yapabilirsiniz.',
  'activity.label':'Aktivite','activity.contact':'İletişim kişisi','activity.addCalendar':'Takvime ekle','activity.addReminder':'Hatırlatıcı ekle','activity.call':'Ara','activity.sms':'SMS','activity.whatsapp':'WhatsApp','activity.email':'E-posta'
};
const ar: Dictionary = {
  'nav.home':'الرئيسية','nav.donation':'تبرع','nav.contact':'اتصل بنا',
  'contact.title':'اتصل بنا','contact.subtitle':'تواصل معنا','contact.location':'الموقع','contact.address':'عنوان المؤسسة','contact.directions':'الاتجاهات','contact.askTitle':'اطرح سؤالاً','contact.askSubtitle':'أرسل سؤالك عبر واتساب','contact.askBody':'هل لديك سؤال؟ تواصل مع المؤسسة عبر واتساب وسنساعدك في أقرب وقت.','contact.askButton':'اسأل عبر واتساب','contact.staff':'جهات الاتصال','contact.noStaff':'لا توجد جهات اتصال مسجلة بعد.','contact.call':'اتصال',
  'home.changeCity':'تغيير المدينة','home.searchCity':'ابحث عن مدينة...','home.useLocation':'استخدم موقعي','home.nextPrayer':'التالي','home.loadingPrayer':'جارٍ تحميل مواقيت الصلاة...','home.todayProgram':'برنامج اليوم','home.upcomingActivities':'الأنشطة القادمة','home.noUpcomingActivities':'لا توجد أنشطة قادمة.','home.news':'الأخبار','home.noNews':'لا توجد أخبار بعد.',
  'install.title':'ثبّت التطبيق','install.description':'أضفه إلى الشاشة الرئيسية للوصول السريع','install.button':'تثبيت','install.close':'إغلاق',
  'common.loading':'جارٍ التحميل...','common.close':'إغلاق','common.save':'حفظ','common.saving':'جارٍ الحفظ...',
  'recovery.title':'اختر كلمة مرور جديدة','recovery.password':'كلمة المرور الجديدة','recovery.repeat':'أعد كتابة كلمة المرور','recovery.show':'إظهار كلمة المرور','recovery.tooShort':'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.','recovery.noMatch':'كلمتا المرور غير متطابقتين.','recovery.noConnection':'لا يوجد اتصال بالنظام.','recovery.failed':'تعذر حفظ كلمة المرور: ','recovery.success':'تم حفظ كلمة المرور. يمكنك الآن تسجيل الدخول باستخدامها.',
  'activity.label':'نشاط','activity.contact':'جهة الاتصال','activity.addCalendar':'إضافة إلى التقويم','activity.addReminder':'إضافة تذكير','activity.call':'اتصال','activity.sms':'رسالة نصية','activity.whatsapp':'واتساب','activity.email':'بريد إلكتروني'
};
const ur: Dictionary = {
  'nav.home':'ہوم','nav.donation':'عطیہ','nav.contact':'رابطہ',
  'contact.title':'رابطہ','contact.subtitle':'ہم سے رابطہ کریں','contact.location':'مقام','contact.address':'تنظیم کا پتہ','contact.directions':'راستہ دیکھیں','contact.askTitle':'سوال پوچھیں','contact.askSubtitle':'واٹس ایپ کے ذریعے سوال بھیجیں','contact.askBody':'کیا آپ کا کوئی سوال ہے؟ واٹس ایپ کے ذریعے تنظیم سے رابطہ کریں۔','contact.askButton':'واٹس ایپ پر پوچھیں','contact.staff':'رابطہ افراد','contact.noStaff':'ابھی کوئی رابطہ فرد درج نہیں ہے۔','contact.call':'کال کریں',
  'home.changeCity':'شہر تبدیل کریں','home.searchCity':'شہر تلاش کریں...','home.useLocation':'میرا مقام استعمال کریں','home.nextPrayer':'اگلی نماز','home.loadingPrayer':'نماز کے اوقات لوڈ ہو رہے ہیں...','home.todayProgram':'آج کا پروگرام','home.upcomingActivities':'آنے والی سرگرمیاں','home.noUpcomingActivities':'کوئی آنے والی سرگرمی نہیں۔','home.news':'خبریں','home.noNews':'ابھی کوئی خبر نہیں۔',
  'install.title':'ایپ انسٹال کریں','install.description':'فوری رسائی کے لیے ہوم اسکرین پر شامل کریں','install.button':'انسٹال','install.close':'بند کریں',
  'common.loading':'لوڈ ہو رہا ہے...','common.close':'بند کریں','common.save':'محفوظ کریں','common.saving':'محفوظ ہو رہا ہے...',
  'recovery.title':'نیا پاس ورڈ منتخب کریں','recovery.password':'نیا پاس ورڈ','recovery.repeat':'نیا پاس ورڈ دوبارہ لکھیں','recovery.show':'پاس ورڈ دکھائیں','recovery.tooShort':'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔','recovery.noMatch':'پاس ورڈ ایک جیسے نہیں ہیں۔','recovery.noConnection':'سسٹم سے رابطہ نہیں ہے۔','recovery.failed':'پاس ورڈ محفوظ نہیں ہو سکا: ','recovery.success':'پاس ورڈ محفوظ ہو گیا۔ اب آپ نئے پاس ورڈ سے لاگ ان کر سکتے ہیں۔',
  'activity.label':'سرگرمی','activity.contact':'رابطہ فرد','activity.addCalendar':'کیلنڈر میں شامل کریں','activity.addReminder':'یاد دہانی شامل کریں','activity.call':'کال','activity.sms':'ایس ایم ایس','activity.whatsapp':'واٹس ایپ','activity.email':'ای میل'
};
const dictionaries: Record<string, Dictionary> = { nb, en, tr, ar, ur };

type I18nValue = { language:string; direction:'ltr'|'rtl'; locale:string; t:(key:string)=>string; reload:()=>Promise<void> };
const I18nContext = createContext<I18nValue>({ language:'nb', direction:'ltr', locale:'nb-NO', t:(key)=>nb[key]||key, reload:async()=>{} });

export function AppI18nProvider({ children }: { children: ReactNode }) {
  const [language,setLanguage]=useState('nb');
  const load=async()=>{
    if(!supabase)return;
    const {data}=await supabase.from('organizations').select('language').eq('id',DEFAULT_ORGANIZATION_ID).maybeSingle();
    setLanguage(findLanguage(data?.language).code);
  };
  useEffect(()=>{void load();const handler=()=>void load();window.addEventListener('yasaflow-organization-settings-changed',handler);return()=>window.removeEventListener('yasaflow-organization-settings-changed',handler);},[]);
  const meta=findLanguage(language);
  useEffect(()=>{document.documentElement.lang=meta.locale;document.documentElement.dir=meta.direction;},[meta.locale,meta.direction]);
  const value=useMemo<I18nValue>(()=>({language:meta.code,direction:meta.direction,locale:meta.locale,t:(key)=>dictionaries[meta.code]?.[key]||en[key]||nb[key]||key,reload:load}),[meta.code,meta.direction,meta.locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useAppI18n(){return useContext(I18nContext);}
