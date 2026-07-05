import { useState } from 'react';
import { HandCoins, X, Copy, Check, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { useApp } from '../context/AppContext';

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  const { settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [openingVipps, setOpeningVipps] = useState(false);
  const vippsNumber = settings?.vippsNumber || '29816';

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
      <div className="absolute inset-0 bg-[#2D2A26]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#FAF6F0] rounded-2xl shadow-2xl border-2 border-[#C5A880]/30 overflow-hidden">
        <div className="relative px-6 py-8 bg-gradient-to-br from-[#C5A880] to-[#B8935A]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <X size={18} className="text-white" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
              <HandCoins size={28} className="text-white" />
            </div>

            <h2 className="font-serif text-2xl text-white">Camiye Destek Ol</h2>
            <p className="text-sm text-white/80 mt-1">
              Bağışlarınız camimizin faaliyetlerine katkı sağlar
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-xl p-5 border-2 border-[#C5A880]/30 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 flex items-center justify-center">
                <HandCoins size={18} className="text-[#C5A880]" />
              </div>
              <span className="text-sm font-semibold text-[#2D2A26]">Vipps</span>
            </div>

            <p className="font-serif text-3xl text-[#2D2A26] tabular-nums mb-4">
              {vippsNumber}
            </p>

            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C5A880]/10 hover:bg-[#C5A880]/20 text-[#C5A880] text-xs font-medium transition-colors"
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

          <button
            type="button"
            onClick={openVipps}
            disabled={openingVipps}
            className="mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F25405] text-white font-semibold text-sm hover:from-[#FF7B45] hover:to-[#F26415] transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {openingVipps ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
            {openingVipps ? 'Vipps Açılıyor...' : 'Vipps Uygulamasında Aç'}
          </button>

          <div className="flex items-start gap-2 text-xs text-[#2D2A26]/50 bg-[#C5A880]/5 rounded-lg p-3 mt-4">
            <Sparkles size={14} className="text-[#C5A880] shrink-0 mt-0.5" />
            <span>
              Tüm bağışlar derneğimizin faaliyetleri, etkinlikleri ve sosyal yardım çalışmalarında kullanılır. Allah kabul etsin.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
