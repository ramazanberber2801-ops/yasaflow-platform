import { useState } from 'react';
import { HandHeart, X, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';
interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  const [copied, setCopied] = useState(false);
  const vippsNumber = "29816";

  if (!open) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(vippsNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Vipps'in resmi internet yönlendirme sayfası (Asla QR hatası vermeyen kesin çözüm)
  const vippsDeepLink = `https://www.vipps.no/i-vipps/vipps-nummer/?number=29816`;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D2A26]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#FAF6F0] rounded-2xl shadow-2xl border-2 border-[#C5A880]/30 overflow-hidden">
        {/* Header */}
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
              <HandHeart size={28} className="text-white" fill="white" />
            </div>
            <h2 className="font-serif text-2xl text-white">Bağış Yapın</h2>
            <p className="text-sm text-white/80 mt-1">Desteğiniz derneğimizin hizmetlerine katkı sağlar</p>
          </div>
        </div>

        {/* Body — Vipps only */}
        <div className="p-6">
          <div className="bg-white rounded-xl p-5 border-2 border-[#C5A880]/30 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 flex items-center justify-center">
                <HandHeart size={18} className="text-[#C5A880]" fill="currentColor" />
              </div>
              <span className="text-sm font-semibold text-[#2D2A26]">Vipps</span>
            </div>
            <p className="font-serif text-3xl text-[#2D2A26] tabular-nums mb-4">{vippsNumber}</p>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C5A880]/10 hover:bg-[#C5A880]/20 text-[#C5A880] text-xs font-medium transition-colors"
            >
              {copied ? <><Check size={14} /> Kopyalandı</> : <><Copy size={14} /> Numarayı Kopyala</>}
            </button>
          </div>

          {/* Vipps App Trigger Button */}
          <a
            href={vippsDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F25405] text-white font-semibold text-sm hover:from-[#FF7B45] hover:to-[#F26415] transition-all shadow-md active:scale-[0.98]"
          >
            <ExternalLink size={18} />
            Vipps Uygulamasında Aç
          </a>

          <div className="flex items-start gap-2 text-xs text-[#2D2A26]/50 bg-[#C5A880]/5 rounded-lg p-3 mt-4">
            <Sparkles size={14} className="text-[#C5A880] shrink-0 mt-0.5" />
            <span>Tüm bağışlar derneğimizin faaliyetleri, etkinlikleri ve sosyal yardım çalışmalarında kullanılır. Allah kabul etsin.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
