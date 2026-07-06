import { X, Calendar, Clock, MapPin, User, MessageCircle, Bell } from 'lucide-react';
import type { SohbetItem } from '../types';
import { WhatsAppButton } from './WhatsAppButton';

interface SohbetModalProps {
  item: (SohbetItem & { image_base64?: string }) | null;
  onClose: () => void;
}

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

function escapeIcsText(value: string | undefined) {
  return String(value || '')
    .replace(/\/g, '\\')
    .replace(/\n/g, '\n')
    .replace(/,/g, '\,')
    .replace(/;/g, '\;');
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
  const description = escapeIcsText(`${item.description}\n\nKonuşmacı: ${item.speaker || ''}`);
  const location = escapeIcsText(item.location);
  const fileName = `${item.title || 'sohbet-ders'}`
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'sohbet-ders';

  const alarm = withReminder
    ? [
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        `DESCRIPTION:${title} programı 1 saat içinde başlayacak.`,
        'END:VALARM',
      ]
    : [];

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DTIM//Sohbet Ders//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${item.id || Date.now()}@dtim.no`,
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
  link.download = `${fileName}${withReminder ? '-hatirlatma' : ''}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openGoogleCalendar(item: SohbetItem, withReminder: boolean) {
  const start = toIcsDate(item.date, item.time).replace(/Z$/, 'Z');
  const end = toIcsDate(item.date, item.time, 120).replace(/Z$/, 'Z');

  const details = `${item.description || ''}\n\nKonuşmacı: ${item.speaker || ''}${
    withReminder ? '\n\nHatırlatma: Google Takvim üzerinden alarm ekleyebilirsiniz.' : ''
  }`;

  const url =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(item.title || 'Sohbet / Ders')}` +
    `&dates=${encodeURIComponent(`${start}/${end}`)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(item.location || '')}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function addToCalendar(item: SohbetItem, withReminder: boolean) {
  if (isAndroid()) {
    openGoogleCalendar(item, withReminder);
  } else {
    downloadCalendarFile(item, withReminder);
  }
}

export function SohbetModal({ item, onClose }: SohbetModalProps) {
  if (!item) return null;

  const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const imageSrc = item.imageBase64 || item.image_base64;
  const infoCardStyle = {
    backgroundColor: '#FFFFFF',
    borderColor: mix(brand.primary, 20),
    color: mix(brand.text, 70),
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-0 sm:p-4 sm:py-8">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: mix(brand.secondary, 70) }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl rounded-none sm:rounded-2xl shadow-2xl border-2 overflow-hidden max-h-screen sm:max-h-[calc(100vh-4rem)] flex flex-col"
        style={{
          backgroundColor: brand.background,
          color: brand.text,
          borderColor: mix(brand.primary, 30),
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b-2 sticky top-0 z-10"
          style={{ backgroundColor: '#FFFFFF', borderColor: mix(brand.primary, 20) }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
              style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}
            >
              Sohbet / Ders
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0"
            style={{ backgroundColor: mix(brand.primary, 10), color: mix(brand.text, 65) }}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={item.title}
              className="w-full h-auto object-contain block"
            />
          )}

          <div className="p-5 sm:p-6">
            <h2 className="font-serif text-xl sm:text-2xl leading-tight mb-4">
              {item.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-2 text-sm rounded-lg border px-3 py-2" style={infoCardStyle}>
                <Calendar size={15} className="shrink-0" style={{ color: brand.primary }} />
                <span className="capitalize">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm rounded-lg border px-3 py-2" style={infoCardStyle}>
                <Clock size={15} className="shrink-0" style={{ color: brand.primary }} />
                <span className="tabular-nums">{item.time}</span>
              </div>

              <div className="flex items-center gap-2 text-sm rounded-lg border px-3 py-2" style={infoCardStyle}>
                <MapPin size={15} className="shrink-0" style={{ color: brand.primary }} />
                <span>{item.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm rounded-lg border px-3 py-2" style={infoCardStyle}>
                <User size={15} className="shrink-0" style={{ color: brand.primary }} />
                <span>{item.speaker}</span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none mb-6">
              <p className="leading-relaxed whitespace-pre-wrap opacity-80" style={{ color: brand.text }}>
                {item.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => addToCalendar(item, false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-semibold text-sm transition-colors shadow-sm"
                style={{ backgroundColor: '#FFFFFF', borderColor: mix(brand.primary, 30), color: brand.text }}
              >
                <Calendar size={18} style={{ color: brand.primary }} />
                Takvime Ekle
              </button>

              <button
                type="button"
                onClick={() => addToCalendar(item, true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                style={{ backgroundColor: brand.primary, color: brand.primaryText }}
              >
                <Bell size={18} />
                Hatırlat Bana
              </button>
            </div>

            <p className="text-[10px] text-center mb-4 opacity-45">
              Hatırlatma seçeneği takvime 1 saat önce alarm ekler.
            </p>

            <WhatsAppButton
              message={`Merhaba Hocam, "${item.title}" programına katılmak istiyorum. Detayları öğrenebilir miyim?`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1FB855] transition-colors shadow-sm"
            >
              <MessageCircle size={18} fill="white" />
              Hocaya Sor
            </WhatsAppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
