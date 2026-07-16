import { useMemo, useState } from 'react';
import { BellRing, Loader2, Send } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getPushTranslation } from '../lib/pushTranslations';
import { sendPushNotification } from '../lib/pushNotifications';

const brand = { primary: 'var(--brand-primary)', text: 'var(--brand-text)', card: 'var(--brand-card)' };
const mix = (color: string, amount: number, fallback = 'transparent') => `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function ManualPushModule({ organizationId }: { organizationId: string }) {
  const { language } = useAppI18n();
  const t = (key: string) => getPushTranslation(language, key);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const canSend = useMemo(() => title.trim().length > 0 && message.trim().length > 0, [title, message]);

  const send = async () => {
    if (!canSend || sending) return;
    if (!window.confirm(t('push.confirm'))) return;
    setSending(true); setResult(''); setError('');
    try {
      const response = await sendPushNotification({ title, body: message, organizationId });
      setResult(`${t('push.sentPrefix')}${response.sent}${t('push.failedCount')}${response.failed}.`);
      setTitle(''); setMessage('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : t('push.sendFailed'));
    } finally { setSending(false); }
  };

  return <div className="space-y-4">
    <section className="rounded-3xl border p-5 shadow-sm sm:p-6" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16), color: brand.text }}><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><BellRing size={20} /></div><div><p className="text-xs font-medium uppercase tracking-[0.18em] opacity-45">{t('push.section')}</p><h3 className="font-serif text-2xl">{t('push.title')}</h3><p className="mt-1 max-w-2xl text-sm leading-6 opacity-60">{t('push.subtitle')}</p></div></div></section>
    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: mix(brand.primary, 16), color: brand.text }}><div className="space-y-4">
      <div><label className="text-xs font-medium">{t('push.heading')} *</label><input className="mt-1 w-full rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: mix(brand.primary, 20) }} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('push.headingPlaceholder')} maxLength={120}/><p className="mt-1 text-right text-[10px] opacity-40">{title.length}/120</p></div>
      <div><label className="text-xs font-medium">{t('push.message')} *</label><textarea rows={7} className="mt-1 w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: mix(brand.primary, 20) }} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t('push.messagePlaceholder')} maxLength={1000}/><p className="mt-1 text-right text-[10px] opacity-40">{message.length}/1000</p></div>
      {(title || message) && <div className="rounded-2xl border p-4" style={{ borderColor: mix(brand.primary, 16), backgroundColor: mix(brand.primary, 7) }}><p className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-45">{t('push.preview')}</p><p className="mt-2 text-sm font-semibold">{title || t('push.previewHeading')}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 opacity-65">{message || t('push.previewMessage')}</p></div>}
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}{result && <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">{result}</p>}
      <button type="button" onClick={() => void send()} disabled={!canSend || sending} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}>{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{sending ? t('push.sending') : t('push.send')}</button>
    </div></section>
  </div>;
}
