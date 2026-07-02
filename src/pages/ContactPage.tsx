import { useEffect, useState } from 'react';
import {
  MapPin,
  User,
  MessageCircle,
  HelpCircle,
  Navigation,
  Phone,
  Bell,
  BellOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { subscribeToPushNotifications } from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

export function ContactPage() {
  const { staff, settings } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();

      setNotificationsEnabled(!!subscription);
    }

    checkSubscription();
  }, []);

  const enableNotifications = async () => {
    setNotificationLoading(true);
    const ok = await subscribeToPushNotifications();
    setNotificationsEnabled(ok);
    setNotificationLoading(false);
  };

  const disableNotifications = async () => {
    setNotificationLoading(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const client = supabase;
        if (client) {
          await client
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint);
        }
      }

      setNotificationsEnabled(false);
      alert('Bildirimler kapatıldı.');
    } catch {
      alert('Bildirimler kapatılamadı.');
    } finally {
      setNotificationLoading(false);
    }
  };

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

      {/* Cami Adresi */}
      <section className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#C5A880]/25 overflow-hidden">
          <div className="relative h-36 overflow-hidden">
            <img src="/images/map-banner.jpg" alt="Harita" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#2D2A26]/20 to-[#2D2A26]/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-[#C5A880]/30">
                <MapPin size={26} className="text-[#C5A880]" fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className="text-[10px] font-semibold text-[#C5A880] uppercase tracking-wider mb-1">
              FİZİKSEL KONUM
            </p>
            <h3 className="font-serif text-lg text-[#2D2A26] mb-2">Cami Adresi</h3>
            <p className="text-sm text-[#2D2A26]/60 leading-relaxed whitespace-pre-line">
              {settings.address}
            </p>

            <a
              href={settings.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('contact_click', 'map', 'Finn frem')}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#2D2A26] text-[#FAF6F0] font-semibold text-sm hover:bg-[#3D3A36] transition-colors shadow-md active:scale-[0.98]"
            >
              <Navigation size={17} />
              FİNN FREM (YOL TARİFİ)
            </a>
          </div>
        </div>
      </section>

      {/* Bildirimler */}
      <section className="px-4 mt-5">
        <div className="bg-white rounded-xl border-2 border-[#C5A880]/25 shadow-md p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-[#C5A880]/15 flex items-center justify-center">
              {notificationsEnabled ? (
                <Bell size={22} className="text-[#C5A880]" />
              ) : (
                <BellOff size={22} className="text-[#C5A880]" />
              )}
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#2D2A26]">Bildirimler</h2>
              <p className="text-xs text-[#2D2A26]/50">
                Duyuru ve sohbetlerden anında haberdar olun
              </p>
            </div>
          </div>

          <button
            onClick={notificationsEnabled ? disableNotifications : enableNotifications}
            disabled={notificationLoading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm ${
              notificationsEnabled
                ? 'bg-[#2D2A26] text-[#FAF6F0]'
                : 'bg-[#C5A880] text-white'
            }`}
          >
            {notificationsEnabled ? <BellOff size={17} /> : <Bell size={17} />}
            {notificationLoading
              ? 'İşleniyor...'
              : notificationsEnabled
                ? 'Bildirimleri Kapat'
                : 'Bildirimleri Aç'}
          </button>
        </div>
      </section>

      {/* Hocaya Sor */}
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
            <div onClick={() => trackEvent('contact_click', 'whatsapp', 'Hocaya Sor')}>
              <WhatsAppButton
                message="Merhaba Hocam, dini bir konuda sorum olacaktı."
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1FB855] transition-colors shadow-sm"
              >
                <MessageCircle size={18} fill="white" />
                WHATSAPP İLE SOR
              </WhatsAppButton>
            </div>
          </div>
        </div>
      </section>

      {/* Staff */}
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
              <div
                key={member.id}
                className="bg-white rounded-xl p-4 shadow-sm border-2 border-[#C5A880]/25 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5A880] to-[#B8935A] flex items-center justify-center shrink-0">
                  <span className="font-serif text-lg text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-sm text-[#2D2A26] truncate">{member.name}</h3>
                  <p className="text-xs text-[#C5A880] font-medium">{member.position}</p>

                  {member.phone && (
                    <a
                      href={`tel:${member.phone.replace(/\s/g, '')}`}
                      onClick={() => trackEvent('contact_click', member.id, member.name)}
                      className="text-xs text-[#2D2A26]/50 hover:text-[#C5A880] transition-colors flex items-center gap-1 mt-1"
                    >
                      <Phone size={11} />
                      {member.phone}
                    </a>
                  )}
                </div>

                {member.phone && (
                  <a
                    href={`tel:${member.phone.replace(/\s/g, '')}`}
                    onClick={() => trackEvent('contact_click', member.id, member.name)}
                    className="w-10 h-10 rounded-full bg-[#C5A880]/15 hover:bg-[#C5A880]/25 flex items-center justify-center transition-colors shrink-0"
                    aria-label={`${member.name} ara`}
                  >
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
