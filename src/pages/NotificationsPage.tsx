import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, Clock3, Loader2, X } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { isPushMessageRead, loadActivePushMessages, markPushMessageRead, type PushMessage } from '../lib/notificationCenter';

const copy: Record<string, Record<string, string>> = {
  nb: { title: 'Varsler', empty: 'Ingen aktive varsler.', unread: 'Ulest', read: 'Lest', close: 'Lukk', error: 'Kunne ikke hente varsler.' },
  en: { title: 'Notifications', empty: 'No active notifications.', unread: 'Unread', read: 'Read', close: 'Close', error: 'Could not load notifications.' },
  tr: { title: 'Bildirimler', empty: 'Aktif bildirim yok.', unread: 'Okunmadı', read: 'Okundu', close: 'Kapat', error: 'Bildirimler yüklenemedi.' },
  ar: { title: 'الإشعارات', empty: 'لا توجد إشعارات نشطة.', unread: 'غير مقروء', read: 'مقروء', close: 'إغلاق', error: 'تعذر تحميل الإشعارات.' },
  ur: { title: 'اطلاعات', empty: 'کوئی فعال اطلاع نہیں۔', unread: 'غیر پڑھی', read: 'پڑھی گئی', close: 'بند کریں', error: 'اطلاعات لوڈ نہیں ہو سکیں۔' },
};

export function NotificationsPage({ initialMessageId, onConsumedInitialMessage }: { initialMessageId?: string | null; onConsumedInitialMessage?: () => void }) {
  const { language, locale, direction } = useAppI18n();
  const text = copy[language] || copy.en;
  const [messages, setMessages] = useState<PushMessage[]>([]);
  const [selected, setSelected] = useState<PushMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, forceReadRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    loadActivePushMessages(DEFAULT_ORGANIZATION_ID)
      .then((data) => {
        if (!alive) return;
        setMessages(data);
        if (initialMessageId) {
          const match = data.find((message) => message.id === initialMessageId);
          if (match) {
            markPushMessageRead(match.id);
            setSelected(match);
          }
          onConsumedInitialMessage?.();
        }
      })
      .catch(() => alive && setError(text.error))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [initialMessageId]);

  const openMessage = (message: PushMessage) => {
    markPushMessageRead(message.id);
    forceReadRefresh((value) => value + 1);
    setSelected(message);
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));

  const unreadCount = useMemo(() => messages.filter((message) => !isPushMessageRead(message.id)).length, [messages, selected]);

  return <div dir={direction} className="min-h-screen pb-28" style={{ background: 'var(--brand-background)', color: 'var(--brand-text)' }}>
    <header className="border-b px-4 py-6" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Bell size={22} /></span>
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] opacity-45">Yasaflow</p><h1 className="text-2xl font-semibold">{text.title}</h1></div>
        {unreadCount > 0 && <span className="ms-auto rounded-full px-3 py-1 text-xs font-bold" style={{ background: '#DC2626', color: '#fff' }}>{unreadCount}</span>}
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-4 py-5">
      {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div> : error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : messages.length === 0 ? <div className="rounded-3xl border p-8 text-center" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}><Bell className="mx-auto mb-3 opacity-25" size={34}/><p className="opacity-55">{text.empty}</p></div> : <div className="space-y-3">{messages.map((message) => {
        const read = isPushMessageRead(message.id);
        return <button key={message.id} onClick={() => openMessage(message)} className="flex w-full items-start gap-4 rounded-3xl border p-4 text-start shadow-sm" style={{ background: 'var(--brand-card)', borderColor: read ? 'var(--brand-border)' : 'var(--brand-primary)' }}>
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Bell size={19}/>{!read && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2" style={{ background: '#DC2626', borderColor: 'var(--brand-card)' }}/>}</span>
          <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><strong className="line-clamp-1">{message.title}</strong><span className="shrink-0 text-[11px] opacity-45">{formatDate(message.created_at)}</span></span><span className="mt-1 block line-clamp-2 text-sm opacity-60">{message.body}</span><span className="mt-3 flex items-center gap-1 text-[11px] font-medium" style={{ color: read ? 'var(--brand-muted-text)' : 'var(--brand-primary)' }}>{read ? <Check size={12}/> : <Clock3 size={12}/>} {read ? text.read : text.unread}</span></span>
        </button>;
      })}</div>}
    </main>

    {selected && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setSelected(null)}>
      <section className="w-full max-w-lg rounded-3xl border p-5 shadow-2xl" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Bell size={22}/></span><div className="min-w-0 flex-1"><h2 className="text-xl font-semibold">{selected.title}</h2><p className="mt-1 text-xs opacity-45">{formatDate(selected.created_at)}</p></div><button onClick={() => setSelected(null)} aria-label={text.close} className="grid h-9 w-9 place-items-center rounded-xl"><X size={20}/></button></div>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-6 opacity-80">{selected.body}</p>
        <button onClick={() => setSelected(null)} className="mt-6 w-full rounded-2xl px-4 py-3 font-semibold" style={{ background: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>{text.close}</button>
      </section>
    </div>}
  </div>;
}
