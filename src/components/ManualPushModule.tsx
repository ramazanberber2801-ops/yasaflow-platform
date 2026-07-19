import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, Loader2, Send } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getPushTranslation } from '../lib/pushTranslations';
import { sendPushNotification } from '../lib/pushNotifications';

const TITLE_LIMIT = 120;
const MESSAGE_LIMIT = 1000;
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
  const [partialFailure, setPartialFailure] = useState(false);

  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const canSend = useMemo(
    () => trimmedTitle.length > 0 && trimmedMessage.length > 0 && !sending,
    [trimmedTitle, trimmedMessage, sending],
  );

  const clearStatus = () => {
    setResult('');
    setError('');
    setPartialFailure(false);
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearStatus();

    if (!trimmedTitle || !trimmedMessage) {
      setError(t('push.validationRequired'));
      return;
    }
    if (sending || !window.confirm(t('push.confirm'))) return;

    setSending(true);
    try {
      const response = await sendPushNotification({
        title: trimmedTitle,
        body: trimmedMessage,
        organizationId,
      });
      const failed = Number(response.failed || 0);
      setPartialFailure(failed > 0);
      setResult(`${t('push.sentPrefix')}${response.sent}${t('push.failedCount')}${failed}.`);
      setTitle('');
      setMessage('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : t('push.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <section
        className="rounded-3xl border p-5 shadow-sm sm:p-6"
        style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16), color: brand.text }}
        aria-labelledby="manual-push-title"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}
            aria-hidden="true"
          >
            <BellRing size={20} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-45">{t('push.section')}</p>
            <h3 id="manual-push-title" className="font-serif text-2xl">{t('push.title')}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 opacity-60">{t('push.subtitle')}</p>
          </div>
        </div>
      </section>

      <section
        className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6"
        style={{ borderColor: mix(brand.primary, 16), color: brand.text }}
      >
        <form className="space-y-4" onSubmit={send} noValidate>
          <div>
            <label htmlFor="push-title" className="text-xs font-medium">{t('push.heading')} *</label>
            <input
              id="push-title"
              className="mt-1 w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2"
              style={{ borderColor: mix(brand.primary, 20) }}
              value={title}
              onChange={(event) => { setTitle(event.target.value); clearStatus(); }}
              placeholder={t('push.headingPlaceholder')}
              maxLength={TITLE_LIMIT}
              required
              disabled={sending}
              aria-describedby="push-title-counter"
            />
            <p id="push-title-counter" className="mt-1 text-right text-[10px] opacity-50">
              {title.length}/{TITLE_LIMIT} {t('push.titleCounter')}
            </p>
          </div>

          <div>
            <label htmlFor="push-message" className="text-xs font-medium">{t('push.message')} *</label>
            <textarea
              id="push-message"
              rows={7}
              className="mt-1 w-full resize-y rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2"
              style={{ borderColor: mix(brand.primary, 20) }}
              value={message}
              onChange={(event) => { setMessage(event.target.value); clearStatus(); }}
              placeholder={t('push.messagePlaceholder')}
              maxLength={MESSAGE_LIMIT}
              required
              disabled={sending}
              aria-describedby="push-message-counter"
            />
            <p id="push-message-counter" className="mt-1 text-right text-[10px] opacity-50">
              {message.length}/{MESSAGE_LIMIT} {t('push.messageCounter')}
            </p>
          </div>

          {(title || message) && (
            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: mix(brand.primary, 16), backgroundColor: mix(brand.primary, 7) }}
              aria-label={t('push.preview')}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-45">{t('push.preview')}</p>
              <p className="mt-2 break-words text-sm font-semibold">{trimmedTitle || t('push.previewHeading')}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 opacity-65">{trimmedMessage || t('push.previewMessage')}</p>
            </div>
          )}

          <div aria-live="polite" aria-atomic="true">
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-xs text-red-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
            {result && (
              <p className={`flex items-start gap-2 rounded-xl px-3 py-3 text-xs ${partialFailure ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'}`}>
                {partialFailure ? <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />}
                <span>{partialFailure ? `${t('push.partialFailure')} ${result}` : result}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSend}
            aria-busy={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            {sending ? t('push.sending') : t('push.send')}
          </button>
        </form>
      </section>
    </div>
  );
}
