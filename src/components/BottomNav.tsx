import { CalendarDays, CalendarRange, Home, Menu } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getBottomNavCopy } from '../lib/appUiCopy';
import type { Page } from '../types';

interface BottomNavProps { current: Page; onNavigate: (page: Page) => void; unreadNotifications?: number; }

type NavPage = 'home' | 'activities' | 'calendar' | 'more';

export function BottomNav({ current, onNavigate, unreadNotifications = 0 }: BottomNavProps) {
  const { language, direction } = useAppI18n();
  const text = getBottomNavCopy(language);
  const items: { page: NavPage; label: string; icon: typeof Home }[] = [
    { page: 'home', label: text.home, icon: Home },
    { page: 'activities', label: text.activities, icon: CalendarRange },
    { page: 'calendar', label: text.calendar, icon: CalendarDays },
    { page: 'more', label: text.more, icon: Menu },
  ];
  return <nav dir={direction} className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md" style={{background:'color-mix(in srgb, var(--brand-background) 96%, white 4%)',borderColor:'var(--brand-border)'}} aria-label={text.more}><div className="mx-auto grid h-[76px] max-w-md grid-cols-4 px-2" style={{paddingBottom:'max(8px, env(safe-area-inset-bottom))'}}>{items.map(({page,label,icon:Icon})=>{const active=current===page;return <button key={page} type="button" onClick={()=>onNavigate(page)} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1"><span className="relative"><Icon size={23} strokeWidth={active?2.6:2} style={{color:active?'var(--brand-primary)':'var(--brand-muted-text)'}}/>{page === 'more' && unreadNotifications > 0 && <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}</span><span className="text-[11px] font-semibold" style={{color:active?'var(--brand-primary)':'var(--brand-muted-text)'}}>{label}</span></button>;})}</div></nav>;
}
