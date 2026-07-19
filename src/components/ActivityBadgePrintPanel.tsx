import { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Registration = {
  registration_id: string;
  full_name: string;
  status: string;
};

type Props = {
  activityId: string;
  organizationId: string;
  registrations: Registration[];
  onError?: (message: string) => void;
};

export function ActivityBadgePrintPanel({ activityId, organizationId, registrations, onError }: Props) {
  const [printingId, setPrintingId] = useState('');
  const confirmed = registrations.filter((row) => row.status === 'confirmed');

  const openBadges = async (registrationId = '') => {
    if (!supabase || printingId) return;
    setPrintingId(registrationId || 'all');

    const popup = window.open('', '_blank');
    if (popup) {
      popup.document.write('<!doctype html><title>Åpner navneskilt…</title><p style="font-family:Arial;padding:24px">Åpner navneskilt…</p>');
    }

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Du må være innlogget for å skrive ut navneskilt.');

      const response = await fetch('/api/activity-badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activityId, organizationId, registrationId }),
      });

      const html = await response.text();
      if (!response.ok) {
        let message = 'Navneskiltene kunne ikke åpnes.';
        try { message = JSON.parse(html)?.error || message; } catch { /* HTML error response */ }
        throw new Error(message);
      }

      if (popup) {
        popup.document.open();
        popup.document.write(html);
        popup.document.close();
      } else {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      popup?.close();
      onError?.(error instanceof Error ? error.message : String(error));
    } finally {
      setPrintingId('');
    }
  };

  return (
    <section className="mt-5 rounded-2xl border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Printer size={18} />
          <div>
            <h4 className="font-semibold">Digitale navneskilt</h4>
            <p className="text-xs opacity-55">A4-oppsett med QR-kode og innsjekkingsstatus.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={!navigator.onLine || printingId === 'all' || confirmed.length === 0}
          onClick={() => void openBadges()}
          className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-45"
        >
          {printingId === 'all' ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
          Skriv ut alle badges
        </button>
      </div>

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {confirmed.map((row) => (
          <article key={row.registration_id} className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.03] p-3">
            <p className="min-w-0 truncate text-sm font-semibold">{row.full_name}</p>
            <button
              type="button"
              disabled={!navigator.onLine || !!printingId}
              onClick={() => void openBadges(row.registration_id)}
              className="flex shrink-0 items-center gap-1 rounded-lg border bg-white px-2 py-2 text-[11px] font-semibold disabled:opacity-45"
            >
              {printingId === row.registration_id ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
              Skriv ut badge
            </button>
          </article>
        ))}
        {confirmed.length === 0 && <p className="rounded-xl bg-black/[0.03] p-3 text-xs opacity-60">Ingen bekreftede deltakere.</p>}
      </div>
    </section>
  );
}
