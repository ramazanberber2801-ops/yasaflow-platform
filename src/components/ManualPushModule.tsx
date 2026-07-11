import { useMemo, useState } from 'react';
import { BellRing, Loader2, Send } from 'lucide-react';
import { sendPushNotification } from '../lib/pushNotifications';

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
  card: 'var(--brand-card)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function ManualPushModule() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const canSend = useMemo(() => title.trim().length > 0 && message.trim().length > 0, [title, message]);

  const send = async () => {
    if (!canSend || sending) return;
    if (!window.confirm('Sende denne push-meldingen til alle som har aktivert varsler?')) return;

    setSending(true);
    setResult('');
    setError('');

    try {
      const response = await sendPushNotification({ title, body: message });
      setResult(`Meldingen ble sendt. Levert: ${response.sent}. Feilet: ${response.failed}.`);
      setTitle('');
      setMessage('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Push-meldingen kunne ikke sendes.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border p-5 shadow-sm sm:p-6" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16), color: brand.text }}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
            <BellRing size={20} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-45">Varslinger</p>
            <h3 className="font-serif text-2xl">Send manuell push-melding</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 opacity-60">Meldingen sendes til brukere som har aktivert varsler. Når de åpner varselet, vises meldingen som popup i appen.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: mix(brand.primary, 16), color: brand.text }}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium">Overskrift *</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-3 text-sm outline-none"
              style={{ borderColor: mix(brand.primary, 20) }}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="For eksempel: Viktig informasjon"
              maxLength={120}
            />
            <p className="mt-1 text-right text-[10px] opacity-40">{title.length}/120</p>
          </div>

          <div>
            <label className="text-xs font-medium">Melding *</label>
            <textarea
              rows={7}
              className="mt-1 w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none"
              style={{ borderColor: mix(brand.primary, 20) }}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Skriv meldingen som skal vises i varselet og i appen."
              maxLength={1000}
            />
            <p className="mt-1 text-right text-[10px] opacity-40">{message.length}/1000</p>
          </div>

          {(title || message) && (
            <div className="rounded-2xl border p-4" style={{ borderColor: mix(brand.primary, 16), backgroundColor: mix(brand.primary, 7) }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-45">Forhåndsvisning</p>
              <p className="mt-2 text-sm font-semibold">{title || 'Overskrift'}</p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 opacity-65">{message || 'Meldingstekst'}</p>
            </div>
          )}

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          {result && <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">{result}</p>}

          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend || sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Sender...' : 'Send push-melding'}
          </button>
        </div>
      </section>
    </div>
  );
}
