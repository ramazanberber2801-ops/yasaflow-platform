import { CalendarDays, CalendarRange, Home, Menu } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import type { Page } from '../types';

interface BottomNavProps { current: Page; onNavigate: (page: Page) => void; }

const labels: Record<string, Record<Page, string>> = {
  nb: { home: 'Hjem', activities: 'Aktiviteter', calendar: 'Kalender', more: 'Mer', contact: 'Kontakt' },
  en: { home: 'Home', activities: 'Activities', calendar: 'Calendar', more: 'More', contact: 'Contact' },
  tr: { home: 'Ana Sayfa', activities: 'Etkinlikler', calendar: 'Takvim', more: 'Daha fazla', contact: 'İletişim' },
  ar: { home: 'الرئيسية', activities: 'الأنشطة', calendar: 'التقويم', more: 'المزيد', contact: 'اتصل بنا' },
  ur: { home: 'ہوم', activities: 'سرگرمیاں', calendar: 'کیلنڈر', more: 'مزید', contact: 'رابطہ' },
};

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  const { language, direction } = useAppI18n();
  const text = labels[language] || labels.en;
  const items: { page: Page; label: string; icon: typeof Home }[] = [
    { page: 'home', label: text.home, icon: Home },
    { page: 'activities', label: text.activities, icon: CalendarRange },
    { page: 'calendar', label: text.calendar, icon: CalendarDays },
    { page: 'more', label: text.more, icon: Menu },
  ];
  return <nav dir={direction} className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md" style={{background:'color-mix(in srgb, var(--brand-background) 96%, white 4%)',borderColor:'var(--brand-border)'}} aria-label={text.more}><div className="mx-auto grid h-[76px] max-w-md grid-cols-4 px-2" style={{paddingBottom:'max(8px, env(safe-area-inset-bottom))'}}>{items.map(({page,label,icon:Icon})=>{const active=current===page;return <button key={page} type="button" onClick={()=>onNavigate(page)} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1"><Icon size={23} strokeWidth={active?2.6:2} style={{color:active?'var(--brand-primary)':'var(--brand-muted-text)'}}/><span className="text-[11px] font-semibold" style={{color:active?'var(--brand-primary)':'var(--brand-muted-text)'}}>{label}</span></button>;})}</div></nav>;
}
