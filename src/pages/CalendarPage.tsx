import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, MapPin } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getCalendarCopy } from '../lib/appUiCopy';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { supabase } from '../lib/supabase';

type Activity = {
  id: string;
  title: string;
  description: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  category: string | null;
};

const pad = (value: number) => String(value).padStart(2, '0');
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function CalendarPage() {
  const { language, locale, direction } = useAppI18n();
  const text = getCalendarCopy(language);
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      setLoading(true);
      setError('');
      const start = toDateKey(new Date(month.getFullYear(), month.getMonth(), 1));
      const end = toDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
      const { data, error: loadError } = await supabase
        .from('organization_activities')
        .select('id,title,description,activity_date,start_time,end_time,location,category')
        .eq('organization_id', DEFAULT_ORGANIZATION_ID)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('activity_date', start)
        .lte('activity_date', end)
        .order('activity_date')
        .order('start_time');
      if (loadError) { setError(loadError.message); setActivities([]); }
      else setActivities((data || []) as Activity[]);
      setLoading(false);
    };
    void load();
  }, [month]);

  const eventsByDate = useMemo(() => activities.reduce<Record<string, Activity[]>>((result, activity) => {
    (result[activity.activity_date] ||= []).push(activity);
    return result;
  }, {}), [activities]);

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const weekdayLabels = useMemo(() => {
    const monday = new Date(2026, 0, 5);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', '');
    });
  }, [locale]);

  const selectedActivities = eventsByDate[selectedDate] || [];
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  const selectedLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${selectedDate}T12:00:00`));
  const moveMonth = (difference: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + difference, 1);
    setMonth(next);
    setSelectedDate(toDateKey(next));
  };
  const goToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDateKey(today));
  };

  return <div className="min-h-screen pb-28" dir={direction} style={{ background: 'var(--brand-background)', color: 'var(--brand-text)' }}>
    <header className="border-b px-4 py-6" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><CalendarDays size={22} /></span>
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] opacity-45">Yasaflow</p><h1 className="text-2xl font-semibold">{text.title}</h1></div>
      </div>
    </header>

    <main className="mx-auto max-w-4xl space-y-5 px-4 py-5">
      <section className="rounded-3xl border p-4 shadow-sm sm:p-5" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => moveMonth(-1)} className="grid h-10 w-10 place-items-center rounded-xl border" style={{ borderColor: 'var(--brand-border)' }} aria-label={text.previousMonth}><ChevronLeft size={20} /></button>
          <button onClick={goToday} className="min-w-0 text-center"><h2 className="truncate text-xl font-semibold capitalize">{monthLabel}</h2><span className="text-xs font-medium" style={{ color: 'var(--brand-primary)' }}>{text.today}</span></button>
          <button onClick={() => moveMonth(1)} className="grid h-10 w-10 place-items-center rounded-xl border" style={{ borderColor: 'var(--brand-border)' }} aria-label={text.nextMonth}><ChevronRight size={20} /></button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase opacity-45">{weekdayLabels.map(label => <div key={label} className="py-2">{label}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(date => {
            const key = toDateKey(date);
            const inMonth = date.getMonth() === month.getMonth();
            const selected = key === selectedDate;
            const isToday = key === toDateKey(today);
            const count = eventsByDate[key]?.length || 0;
            return <button key={key} onClick={() => { setSelectedDate(key); if (!inMonth) setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }} className="relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-2xl text-sm font-medium transition" style={{ background: selected ? 'var(--brand-primary)' : isToday ? 'var(--brand-subtle)' : 'transparent', color: selected ? 'var(--brand-primary-text)' : inMonth ? 'var(--brand-text)' : 'var(--brand-muted-text)' }}>
              <span>{date.getDate()}</span>
              {count > 0 && <span className="mt-1 flex gap-0.5" aria-label={text.eventCount(count)}>{Array.from({ length: Math.min(count, 3) }, (_, index) => <span key={index} className="h-1.5 w-1.5 rounded-full" style={{ background: selected ? 'var(--brand-primary-text)' : 'var(--brand-primary)' }} />)}</span>}
            </button>;
          })}
        </div>
      </section>

      <section className="rounded-3xl border p-5 shadow-sm" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] opacity-45">{text.activities}</p><h2 className="mt-1 text-xl font-semibold capitalize">{selectedLabel}</h2></div>{selectedActivities.length > 0 && <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>{selectedActivities.length}</span>}</div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div> : error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : selectedActivities.length === 0 ? <p className="mt-4 rounded-2xl border p-5 text-sm opacity-50" style={{ borderColor: 'var(--brand-border)' }}>{text.empty}</p> : <div className="mt-4 space-y-3">{selectedActivities.map(activity => <article key={activity.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--brand-border)' }}><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><CalendarDays size={18} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{activity.title}</h3>{activity.category && <span className="rounded-full px-2 py-1 text-[10px]" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>{activity.category}</span>}</div>{activity.description && <p className="mt-1 line-clamp-2 text-sm opacity-60">{activity.description}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs opacity-60">{activity.start_time && <span className="flex items-center gap-1"><Clock3 size={13}/>{activity.start_time.slice(0,5)}{activity.end_time ? `–${activity.end_time.slice(0,5)}` : ''}</span>}{activity.location && <span className="flex items-center gap-1"><MapPin size={13}/>{activity.location}</span>}</div></div></div></article>)}</div>}
      </section>
    </main>
  </div>;
}
