import { X, Calendar, Tag } from 'lucide-react';
import type { NewsItem } from '../types';

interface NewsModalProps {
  item: (NewsItem & { image_base64?: string }) | null;
  onClose: () => void;
}

export function NewsModal({ item, onClose }: NewsModalProps) {
  if (!item) return null;

  const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const imageSrc = item.imageBase64 || item.image_base64;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-0 sm:p-4 sm:py-8">
      <div
        className="absolute inset-0 bg-[#2D2A26]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#FAF6F0] rounded-none sm:rounded-2xl shadow-2xl border border-[#C5A880]/30 overflow-hidden max-h-screen sm:max-h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C5A880]/20 bg-[#FAF6F0] sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Tag size={16} className="text-[#C5A880] shrink-0" />
            <span className="text-xs font-medium text-[#2D2A26]/60 uppercase tracking-wide truncate">
              {item.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#C5A880]/15 flex items-center justify-center transition-colors shrink-0"
            aria-label="Kapat"
          >
            <X size={20} className="text-[#2D2A26]/60" />
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
            <h2 className="font-serif text-xl sm:text-2xl text-[#2D2A26] leading-tight mb-3">
              {item.title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-[#2D2A26]/50 mb-4">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {formattedDate}
              </span>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-[#2D2A26]/80 leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
