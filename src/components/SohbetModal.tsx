import { X, Calendar, Clock, MapPin, User, Bell } from 'lucide-react';
import type { SohbetItem } from '../types';

interface SohbetModalProps {
  item: (SohbetItem & { image_base64?: string }) | null;
  onClose: () => void;
}

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

function escapeIcsText(value: string | undefined) {
  return String(value || '')
    .split('\\').join('\\\\')
    .split('\n').join('\\n')
    .split(',').join('\\,')
    .split(';').join('\\;');
}

function toIcsDate(date: string, time: string, addMinutes = 0) {
  const [hours = '0', minutes = '0'] = (time || '00:00').split(':');
  const start = new Date(date);
  start.setHours(Number(hours), Number(minutes) + addMinutes, 0, 0);
  return start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function downloadCalendarFile(item: SohbetItem, withReminder: boolean) {
  const start = toIcsDate(item.date, item.time);
  const end = toIcsDate(item.date, item.time, 120);
  const title = escapeIcsText(item.title);
  const description = escapeIcsText(`${item.description}\n\nKontaktperson: ${item.speaker || ''}`);
  const location = escapeIcsText(item.location);
  const fileName = `${item.title || 'aktivitet'}`
    .toLowerCase()
    .replace(/[^a-z0-9æøåäöüß]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'aktivitet';

  const alarm = withReminder
    ? [
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        `DESCRIPTION:${title} starter om 1 time.`,
        'END:VALARM',
      ]
    : [];

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Yasaflow//Activity//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${item.id || Date.now()}@yasaflow.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    ...alarm,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}${withReminder ? '-påminnelse' : ''}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openGoogleCalendar(item: SohbetItem, withReminder: boolean) {
  const start = toIcsDate(item.date, item.time).replace(/Z$/, 'Z');
  const end = toIcsDate(item.date, item.time, 120).replace(/Z$/, 'Z');
  const details = `${item.description || ''}\n\nKontaktperson: ${item.speaker || ''}${
    withReminder ? '\n\nDu kan legge til et varsel i Google Kalender.' : ''
  }`;

  const url =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(item.title || 'Aktivitet')}` +
    `&dates=${encodeURIComponent(`${start}/${end}`)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(item.location || '')}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function addToCalendar(item: SohbetItem, withReminder: boolean) {
  if (isAndroid()) openGoogleCalendar(item, withReminder);
  else downloadCalendarFile(item, withReminder);
}

export function SohbetModal({ item, onClose }: SohbetModalProps) {
  if (!item) return null;

  const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const imageSrc = item.imageBase64 || item.image_base64;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-0 sm:p-4 sm:py-8">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: mix(brand.secondary, 70) }} onClick={onClose} />
      <div className="theme-surface relative flex max-h-screen w-full max-w-2xl flex-col overflow-hidden rounded-none border-2 shadow-2xl sm:max-h-[calc(100vh-4rem)] sm:rounded-2xl">
        <div className="theme-surface sticky top-0 z-10 flex items-center justify-between border-b-2 px-5 py-4">
          <span className="rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: 'var(--brand-subtle)', color: brand.primary }}>Aktivitet</span>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--brand-subtle)', color: mix(brand.text, 65) }} aria-label="Lukk"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {imageSrc && <img src={imageSrc} alt={item.title} className="block h-auto w-full object-contain" />}
          <div className="p-5 sm:p-6">
            <h2 className="mb-4 font-serif text-xl leading-tight sm:text-2xl">{item.title}</h2>
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {item.date && <div className="theme-card theme-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Calendar size={15} className="shrink-0" style={{ color: brand.primary }} /><span className="capitalize">{formattedDate}</span></div>}
              {item.time && <div className="theme-card theme-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Clock size={15} className="shrink-0" style={{ color: brand.primary }} /><span className="tabular-nums">{item.time}</span></div>}
              {item.location && <div className="theme-card theme-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><MapPin size={15} className="shrink-0" style={{ color: brand.primary }} /><span>{item.location}</span></div>}
              {item.speaker && <div className="theme-card theme-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><User size={15} className="shrink-0" style={{ color: brand.primary }} /><span>{item.speaker}</span></div>}
            </div>

            {item.description && <div className="prose prose-sm mb-6 max-w-none"><p className="whitespace-pre-wrap leading-relaxed opacity-80" style={{ color: brand.text }}>{item.description}</p></div>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => addToCalendar(item, false)} className="theme-card flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-semibold shadow-sm"><Calendar size={18} style={{ color: brand.primary }} />Legg til i kalender</button>
              <button type="button" onClick={() => addToCalendar(item, true)} className="theme-primary-button flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm"><Bell size={18} />Legg til påminnelse</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
