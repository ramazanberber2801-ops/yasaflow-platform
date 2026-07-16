type Dictionary = Record<string, string>;

const nb: Dictionary = {
  'onboarding.checking':'Kontrollerer oppsettet...','onboarding.doneTitle':'Grunnoppsettet er ferdig','onboarding.doneBody':'Organisasjonen er klar til daglig bruk. Du kan fortsatt justere tema, moduler og innhold når som helst.','onboarding.title':'Kom i gang med organisasjonen','onboarding.progressOf':'av','onboarding.progressSteps':'steg er fullført.',
  'onboarding.profileTitle':'Fyll ut organisasjonsprofil','onboarding.profileBody':'Navn og minst én kontaktopplysning.','onboarding.logoTitle':'Legg til logo eller appikon','onboarding.logoBody':'Gjør appen gjenkjennelig for medlemmer.','onboarding.staffTitle':'Legg til styret eller ansatte','onboarding.staffBody':'Vis hvem som administrerer organisasjonen.','onboarding.newsTitle':'Publiser første nyhet','onboarding.newsBody':'Gi medlemmene noe å møte i appen.','onboarding.activityTitle':'Opprett første aktivitet','onboarding.activityBody':'Legg inn et kommende arrangement.'
};
const en: Dictionary = {
  'onboarding.checking':'Checking setup...','onboarding.doneTitle':'Basic setup is complete','onboarding.doneBody':'The organization is ready for daily use. You can still adjust the theme, modules and content at any time.','onboarding.title':'Get started with the organization','onboarding.progressOf':'of','onboarding.progressSteps':'steps completed.',
  'onboarding.profileTitle':'Complete the organization profile','onboarding.profileBody':'Add a name and at least one contact detail.','onboarding.logoTitle':'Add a logo or app icon','onboarding.logoBody':'Make the app recognizable to members.','onboarding.staffTitle':'Add board members or staff','onboarding.staffBody':'Show who manages the organization.','onboarding.newsTitle':'Publish the first news item','onboarding.newsBody':'Give members something to see in the app.','onboarding.activityTitle':'Create the first activity','onboarding.activityBody':'Add an upcoming event.'
};
const tr: Dictionary = {
  'onboarding.checking':'Kurulum kontrol ediliyor...','onboarding.doneTitle':'Temel kurulum tamamlandı','onboarding.doneBody':'Kuruluş günlük kullanıma hazır. Tema, modüller ve içerik daha sonra da değiştirilebilir.','onboarding.title':'Kuruluşunuzu hazırlayın','onboarding.progressOf':'/','onboarding.progressSteps':'adım tamamlandı.',
  'onboarding.profileTitle':'Kuruluş profilini tamamlayın','onboarding.profileBody':'Ad ve en az bir iletişim bilgisi ekleyin.','onboarding.logoTitle':'Logo veya uygulama simgesi ekleyin','onboarding.logoBody':'Uygulamayı üyeler için tanınır hale getirin.','onboarding.staffTitle':'Yönetim kurulu veya çalışan ekleyin','onboarding.staffBody':'Kuruluşu kimlerin yönettiğini gösterin.','onboarding.newsTitle':'İlk haberi yayınlayın','onboarding.newsBody':'Üyelere uygulamada görecekleri bir içerik sunun.','onboarding.activityTitle':'İlk etkinliği oluşturun','onboarding.activityBody':'Yaklaşan bir etkinlik ekleyin.'
};
const ar: Dictionary = {
  'onboarding.checking':'جارٍ التحقق من الإعداد...','onboarding.doneTitle':'اكتمل الإعداد الأساسي','onboarding.doneBody':'المؤسسة جاهزة للاستخدام اليومي. ويمكنك تعديل المظهر والوحدات والمحتوى في أي وقت.','onboarding.title':'ابدأ بإعداد المؤسسة','onboarding.progressOf':'من','onboarding.progressSteps':'خطوات مكتملة.',
  'onboarding.profileTitle':'أكمل ملف المؤسسة','onboarding.profileBody':'أضف الاسم ومعلومة اتصال واحدة على الأقل.','onboarding.logoTitle':'أضف شعاراً أو رمز التطبيق','onboarding.logoBody':'اجعل التطبيق معروفاً للأعضاء.','onboarding.staffTitle':'أضف أعضاء مجلس الإدارة أو الموظفين','onboarding.staffBody':'وضّح من يدير المؤسسة.','onboarding.newsTitle':'انشر أول خبر','onboarding.newsBody':'امنح الأعضاء محتوى يظهر في التطبيق.','onboarding.activityTitle':'أنشئ أول نشاط','onboarding.activityBody':'أضف فعالية قادمة.'
};
const ur: Dictionary = {
  'onboarding.checking':'سیٹ اپ چیک ہو رہا ہے...','onboarding.doneTitle':'بنیادی سیٹ اپ مکمل ہے','onboarding.doneBody':'تنظیم روزمرہ استعمال کے لیے تیار ہے۔ تھیم، ماڈیولز اور مواد بعد میں بھی تبدیل کیے جا سکتے ہیں۔','onboarding.title':'تنظیم کا آغاز کریں','onboarding.progressOf':'میں سے','onboarding.progressSteps':'مراحل مکمل ہیں۔',
  'onboarding.profileTitle':'تنظیم کا پروفائل مکمل کریں','onboarding.profileBody':'نام اور کم از کم ایک رابطہ تفصیل شامل کریں۔','onboarding.logoTitle':'لوگو یا ایپ آئیکن شامل کریں','onboarding.logoBody':'ارکان کے لیے ایپ کو پہچاننے کے قابل بنائیں۔','onboarding.staffTitle':'بورڈ اراکین یا عملہ شامل کریں','onboarding.staffBody':'دکھائیں کہ تنظیم کون چلاتا ہے۔','onboarding.newsTitle':'پہلی خبر شائع کریں','onboarding.newsBody':'ارکان کے لیے ایپ میں مواد شامل کریں۔','onboarding.activityTitle':'پہلی سرگرمی بنائیں','onboarding.activityBody':'آنے والا پروگرام شامل کریں۔'
};

const dictionaries: Record<string, Dictionary> = { nb, en, tr, ar, ur };
export function getOnboardingTranslation(language: string, key: string) {
  return dictionaries[language]?.[key] || en[key] || nb[key] || key;
}
