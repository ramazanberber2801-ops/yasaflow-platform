import { MapPin, User, MessageCircle, HelpCircle, Navigation, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WhatsAppButton } from '../components/WhatsAppButton';

export function ContactPage() {
  const { staff, settings } = useApp();

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <section className="relative h-[32vh] min-h-[200px] overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/community.jpg" alt="İletişim" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2D2A26]/40 to-[#2D2A26]/80" />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-serif text-2xl sm:text-3xl text-[#FAF6F0]">İletişim</h1>
          <p className="text-sm text-[#FAF6F0]/70 mt-2">Bizimle iletişime geçin</p>
        </div>
      </section>

      {/* ===== Cami Adresi — Map Banner Card ===== */}
      <section className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#C5A880]/25 overflow-hidden">
          {/* Map banner image with centered pin */}
          <div className="relative h-36 overflow-hidden">
            <img
              src="/images/map-banner.jpg"
              alt="Harita"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#2D2A26]/20 to-[#2D2A26]/40" />
            {/* Centered location pin circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-[#C5A880]/30">
                <MapPin size={26} className="text-[#C5A880]" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="p-5">
            <p className="text-[10px] font-semibold text-[#C5A880] uppercase tracking-wider mb-1">
              FİZİKSEL KONUM
            </p>
            <h3 className="font-serif text-lg text-[#2D2A26] mb-2">Cami Adresi</h3>
            <p className="text-sm text-[#2D2A26]/60 leading-relaxed whitespace-pre-line">
              {settings.address}
            </p>

            {/* FINN FREM button */}
            <a
              href={settings.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#2D2A26] text-[#FAF6F0] font-semibold text-sm hover:bg-[#3D3A36] transition-colors shadow-md active:scale-[0.98]"
            >
              <Navigation size={17} />
              FİNN FREM (YOL TARİFİ)
            </a>
          </div>
        </div>
      </section>

      {/* ===== Hocaya Sor Section ===== */}
      <section className="px-4 mt-5">
        <div className="bg-white rounded-xl border-2 border-[#C5A880]/25 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#25D366] to-[#1FB855] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <HelpCircle size={22} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-lg text-white">Hocaya Sor</h2>
                <p className="text-xs text-white/80">Dini sorularınızı WhatsApp üzerinden sorun</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-[#2D2A26]/70 leading-relaxed mb-4">
              Dini konularda aklınıza takılan sorular mı var? İmamımız, dini sorularınızı
              WhatsApp üzerinden yanıtlamaktan mutluluk duyacaktır. Sorularınızı çekinmeden iletebilirsiniz.
            </p>
            <WhatsAppButton
              message="Merhaba Hocam, dini bir konuda sorum olacaktı."
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1FB855] transition-colors shadow-sm"
            >
              <MessageCircle size={18} fill="white" />
              WHATSAPP İLE SOR
            </WhatsAppButton>
          </div>
        </div>
      </section>

      {/* Staff Section - Dernek Kadromuz */}
      <section className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <User size={18} className="text-[#C5A880]" />
          <h2 className="font-serif text-lg text-[#2D2A26]">Dernek Kadromuz</h2>
        </div>

        {staff.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border-2 border-[#C5A880]/25">
            <User size={32} className="mx-auto text-[#C5A880]/40 mb-2" />
            <p className="text-sm text-[#2D2A26]/50">Henüz kayıtlı personel yok.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {staff.map((member) => (
              <div key={member.id} className="bg-white rounded-xl p-4 shadow-sm border-2 border-[#C5A880]/25 flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5A880] to-[#B8935A] flex items-center justify-center shrink-0">
                  <span className="font-serif text-lg text-white">{member.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-sm text-[#2D2A26] truncate">{member.name}</h3>
                  <p className="text-xs text-[#C5A880] font-medium">{member.position}</p>
                  {member.phone && (
                    <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="text-xs text-[#2D2A26]/50 hover:text-[#C5A880] transition-colors flex items-center gap-1 mt-1">
                      <Phone size={11} />{member.phone}
                    </a>
                  )}
                </div>
                {member.phone && (
                  <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="w-10 h-10 rounded-full bg-[#C5A880]/15 hover:bg-[#C5A880]/25 flex items-center justify-center transition-colors shrink-0" aria-label={`${member.name} ara`}>
                    <Phone size={16} className="text-[#C5A880]" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
