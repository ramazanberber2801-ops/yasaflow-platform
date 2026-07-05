import { useState } from 'react';
import { HandCoins, X, Copy, Check, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { useApp } from '../context/AppContext';

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

function cleanVippsDonationUrl(value: unknown) {
  const url = String(value || '').trim();
  return url.startsWith('https://') ? url : '';
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  const { settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [openingVipps, setOpeningVipps] = useState(false);
  const vippsNumber = settings?.vippsNumber || '29816';
  const vippsButtonEnabled = settings?.vippsButtonEnabled !== false;
  const vippsDonationUrl = cleanVippsDonationUrl(settings?.vippsDonationUrl);

  if (!open) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(vippsNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fallbackVippsUrl = `https://www.vipps.no/i-vipps/vipps-nummer/?number=${encodeURIComponent(vippsNumber)}`;

  const openVipps = async () => {
    setOpeningVipps(true);

    try {
      if (vippsDonationUrl) {
        await trackEvent('donation_click', vippsNumber, 'Vipps donation URL');
        window.location.href = vippsDonationUrl;
        return;
      }

      const res = await fetch('/api/vipps-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vippsNumber }),
      });

      const data = await res.json().catch(() => ({}));
      const targetUrl = data.url || data.fallbackUrl || fallbackVippsUrl;

      await trackEvent('donation_click', vippsNumber, data.source || 'Vipps');
      window.location.href = targetUrl;
    } catch (error) {
      console.error('Vipps åpning feilet:', error);
      await trackEvent('donation_click', vippsNumber, 'Vipps fallback');
      window.location.href = fallbackVippsUrl;
    } finally {
      setOpeningVipps(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 60%, transparent)' }} onClick={onClose} />

      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl border-2 overflow-hidden"
        style={{
          backgroundColor: 'var(--brand-background)',
          color: 'var(--brand-text)',
          borderColor: 'color-mix(in srgb, var(--brand-primary) 30%, transparent)',
        }}
      >
        <div
          className="relative px-6 py-8"
          style={{
            background: 'linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 80%, #000 20%))',
            color: 'var(--brand-primary-text)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
              <HandCoins size={28} />
            </div>

            <h2 className="font-serif text-2xl">Camiye Destek Ol</h2>
            <p className="text-sm opacity-80 mt-1">
              Bağışlarınız camimizin faaliyetlerine katkı sağlar
            </p>
          </div>
        </div>

        <div className="p-6">
          <div
            className="bg-white rounded-xl p-5 border-2 shadow-sm text-center"
            style={{ borderColor: 'color-mix(in srgb, var(--brand-primary) 30%, transparent)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
              >
                <HandCoins size={18} style={{ color: 'var(--brand-primary)' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>Vipps</span>
            </div>

            <p className="font-serif text-3xl tabular-nums mb-4" style={{ color: 'var(--brand-text)' }}>
              {vippsNumber}
            </p>

            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)',
                color: 'var(--brand-primary)',
              }}
            >
              {copied ? (
                <>
                  <Check size={14} /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy size={14} /> Numarayı Kopyala
                </>
              )}
            </button>
          </div>

          {vippsButtonEnabled && (
            <button
              type="button"
              onClick={openVipps}
              disabled={openingVipps}
              className="mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand-secondary)', color: 'var(--brand-secondary-text)' }}
            >
              {openingVipps ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
              {openingVipps ? 'Vipps Açılıyor...' : 'Vipps Uygulamasında Aç'}
            </button>
          )}

          {!vippsButtonEnabled && (
            <p className="mt-4 text-center text-xs opacity-50">
              Vipps uygulaması bağlantısı kapalı. Bağış için numarayı kopyalayabilirsiniz.
            </p>
          )}

          <div
            className="flex items-start gap-2 text-xs rounded-lg p-3 mt-4"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--brand-primary) 5%, transparent)',
              color: 'color-mix(in srgb, var(--brand-text) 60%, transparent)',
            }}
          >
            <Sparkles size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--brand-primary)' }} />
            <span>
              Tüm bağışlar derneğimizin faaliyetleri, etkinlikleri ve sosyal yardım çalışmalarında kullanılır. Allah kabul etsin.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
