import { useState } from 'react';
import { X, Copy, Check, HandHeart, Moon, Sparkles, ExternalLink } from 'lucide-react';

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

  const vippsDeepLink = `https://qr.vipps.no/28/?v=1&e=${vippsNumber}`;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D2A26]/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#FAF6F0] rounded-[2rem] shadow-2xl border border-[#C5A880]/20 overflow-hidden">
        {/* Header - Hilal Temalı */}
        <div className="px-6 pt-10 pb-6 text-center relative overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors">
            <X size={20} className="text-[#2D2A26]" />
          </button>
          
          <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
             {/* Hilal ve Veren El Simgesi */}
             <div className="absolute inset-0 bg-[#C5A880]/10 rounded-full blur-xl" />
             <Moon size={60} className="text-[#C5A880] absolute rotate-[-15deg]" />
             <HandHeart size={40} className="text-[#2D2A26] relative z-10" />
          </div>
          
          <h2 className="font-serif text-2xl text-[#2D2A26]">Destek ve İyilik</h2>
          <p className="text-sm text-[#2D2A26]/60 mt-1 italic">"Veren el, alan elden üstündür."</p>
        </div>

        {/* Body */}
        <div className="px-6 pb-8">
          <div className="bg-white rounded-3xl p-6 border border-[#C5A880]/10 shadow-sm text-center mb-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#C5A880] mb-2">Vipps Numarası</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-4xl font-bold text-[#2D2A26]">{vippsNumber}</span>
              <button onClick={copyToClipboard} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-[#C5A880]" />}
              </button>
            </div>
          </div>

          <a
            href={vippsDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#2D2A26] text-white font-bold text-base hover:bg-[#C5A880] transition-colors shadow-lg active:scale-[0.98]"
          >
            <span>Vipps ile Destek Ol</span>
            <ExternalLink size={18} />
          </a>

          <div className="mt-6 flex items-start gap-3 text-[11px] text-[#2D2A26]/40 text-center">
            <Sparkles size={14} className="text-[#C5A880] shrink-0 mx-auto" />
            <p>Yaptığınız hayırların kabul olması dileğiyle. Bağışlarınız camimizin tüm sosyal yardım faaliyetlerinde kullanılmaktadır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
