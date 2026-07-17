import { CalendarDays } from 'lucide-react';
import { PublicActivitiesCalendar } from '../components/PublicActivitiesCalendar';
import { useAppI18n } from '../lib/appI18n';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';

const copy: Record<string, { title: string; description: string }> = {
  nb: { title: 'Kalender', description: 'Kalenderen viser organisasjonens publiserte aktiviteter. Du kan åpne en aktivitet og legge den til i din personlige kalender.' },
  en: { title: 'Calendar', description: 'The calendar shows the organization’s published activities. Open an activity to add it to your personal calendar.' },
  tr: { title: 'Takvim', description: 'Takvim, kuruluşun yayınlanan etkinliklerini gösterir. Bir etkinliği açarak kişisel takviminize ekleyebilirsiniz.' },
  ar: { title: 'التقويم', description: 'يعرض التقويم أنشطة المؤسسة المنشورة. يمكنك فتح النشاط وإضافته إلى تقويمك الشخصي.' },
  ur: { title: 'کیلنڈر', description: 'کیلنڈر تنظیم کی شائع شدہ سرگرمیاں دکھاتا ہے۔ کسی سرگرمی کو کھول کر اپنے ذاتی کیلنڈر میں شامل کریں۔' },
};

export function CalendarPage() {
  const { language, locale, direction } = useAppI18n();
  const text = copy[language] || copy.en;
  return (
    <div className="min-h-screen pb-28" dir={direction} style={{ background: 'var(--brand-background)', color: 'var(--brand-text)' }}>
      <header className="border-b px-4 py-6" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><CalendarDays size={22} /></span>
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] opacity-45">Yasaflow</p><h1 className="text-2xl font-semibold">{text.title}</h1></div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-4 rounded-2xl border p-4 text-sm opacity-70" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>{text.description}</div>
        <PublicActivitiesCalendar organizationId={DEFAULT_ORGANIZATION_ID} locale={locale} />
      </main>
    </div>
  );
}
