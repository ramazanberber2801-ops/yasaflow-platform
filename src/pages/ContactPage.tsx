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
import { getNotificationTranslations, isRtlNotificationLanguage } from '../lib/notificationTranslations';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function ContactPage() {
  const { staff, settings } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const notificationLanguage = settings?.language || settings?.locale || null;
  const notificationText = getNotificationTranslations(notificationLanguage);
  const notificationDirection = isRtlNotificationLanguage(notificationLanguage) ? 'rtl' : 'ltr';

  useEffect(() => {
    trackEvent('contact_click', 'page', 'İletişim Sayfası');
  }, []);

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
          await client.from('push_subscriptions').delete().eq('endpoint', endpoint);
        }
      }
      setNotificationsEnabled(false);
      alert(notificationText.disabledSuccess);
    } catch {
      alert(notificationText.disabledError);
    } finally {
      setNotificationLoading(false);
    }
  };

  const lightCardStyle = {
    backgroundColor: 'var(--brand-card)',
    color: 'var(--brand-card-text)',
    borderColor: 'var(--brand-border)',
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: brand.background, color: brand.text }}>
      <section className="relative h-[32vh] min-h-[200px] overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/community.jpg" alt="İletişim" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${mix(brand.secondary, 40)}, ${mix(brand.secondary, 80)})` }} />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6" style={{ color: brand.secondaryText }}>
          <h1 className="font-serif text-2xl sm:text-3xl">İletişim</h1>
          <p className="text-sm opacity-70 mt-2">Bizimle iletişime geçin</p>
        </div>
      </section>

      <section className="px-4 -mt-8 relative z-10">
        <div className="rounded-2xl shadow-lg border-2 overflow-hidden" style={lightCardStyle}>
          <div className="relative h-36 overflow-hidden">
            <img src="/images/map-banner.jpg" alt="Harita" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${mix(brand.secondary, 20)}, ${mix(brand.secondary, 40)})` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-2 theme-card" style={{ borderColor: mix(brand.primary, 30) }}>
                <MapPin size={26} style={{ color: brand.primary }} fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: brand.primary }}>FİZİKSEL KONUM</p>
            <h3 className="font-serif text-lg mb-2">Cami Adresi</h3>
            <p className="text-sm opacity-60 leading-relaxed whitespace-pre-line">{settings.address}</p>
            <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('contact_click', 'map', 'Finn frem')} className="theme-secondary-panel mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-md active:scale-[0.98]">
              <Navigation size={17} />
              FİNN FREM (YOL TARİFİ)
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 mt-5">
        <div
          className="rounded-xl border-2 shadow-md p-5"
          style={{ ...lightCardStyle, color: brand.text }}
          dir={notificationDirection}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-subtle)' }}>
              {notificationsEnabled ? <Bell size={22} style={{ color: brand.primary }} /> : <BellOff size={22} style={{ color: brand.primary }} />}
            </div>
            <div className="min-w-0 flex-1" style={{ color: brand.text }}>
              <h2 className="font-serif text-lg" style={{ color: brand.text }}>{notificationText.title}</h2>
              <p className="text-sm leading-6 mt-1" style={{ color: `color-mix(in srgb, ${brand.text} 68%, transparent)` }}>
                {notificationText.description}
              </p>
            </div>
          </div>

          <button
            onClick={notificationsEnabled ? disableNotifications : enableNotifications}
            disabled={notificationLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
            style={{ backgroundColor: notificationsEnabled ? brand.secondary : brand.primary, color: notificationsEnabled ? brand.secondaryText : brand.primaryText }}
          >
            {notificationsEnabled ? <BellOff size={17} /> : <Bell size={17} />}
            {notificationLoading ? notificationText.processing : notificationsEnabled ? notificationText.disableButton : notificationText.enableButton}
          </button>
        </div>
      </section>

      <section className="px-4 mt-5">
        <div className="rounded-xl border-2 shadow-md overflow-hidden" style={lightCardStyle}>
          <div className="px-5 py-4" style={{ backgroundColor: brand.primary, color: brand.primaryText }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0"><HelpCircle size={22} /></div>
              <div><h2 className="font-serif text-lg">Hocaya Sor</h2><p className="text-xs opacity-80">Dini sorularınızı WhatsApp üzerinden sorun</p></div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm opacity-70 leading-relaxed mb-4">Dini konularda aklınıza takılan sorular mı var? İmamımız, dini sorularınızı WhatsApp üzerinden yanıtlamaktan mutluluk duyacaktır. Sorularınızı çekinmeden iletebilirsiniz.</p>
            <div onClick={() => trackEvent('contact_click', 'whatsapp', 'Hocaya Sor')}>
              <WhatsAppButton message="Merhaba Hocam, dini bir konuda sorum olacaktı." className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1FB855] transition-colors shadow-sm">
                <MessageCircle size={18} fill="white" />
                WHATSAPP İLE SOR
              </WhatsAppButton>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3"><User size={18} style={{ color: brand.primary }} /><h2 className="font-serif text-lg">Dernek Kadromuz</h2></div>
        {staff.length === 0 ? (
          <div className="rounded-xl p-8 text-center border-2" style={lightCardStyle}><User size={32} className="mx-auto mb-2" style={{ color: mix(brand.primary, 40) }} /><p className="text-sm opacity-50">Henüz kayıtlı personel yok.</p></div>
        ) : (
          <div className="space-y-2.5">
            {staff.map((member) => (
              <div key={member.id} className="rounded-xl p-4 shadow-sm border-2 flex items-center gap-4 hover:shadow-md transition-all" style={lightCardStyle}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${mix(brand.primary, 80, '#000')})`, color: brand.primaryText }}><span className="font-serif text-lg">{member.name.charAt(0).toUpperCase()}</span></div>
                <div className="flex-1 min-w-0"><h3 className="font-serif text-sm truncate">{member.name}</h3><p className="text-xs font-medium" style={{ color: brand.primary }}>{member.position}</p>{member.phone && <a href={`tel:${member.phone.replace(/\s/g, '')}`} onClick={() => trackEvent('contact_click', member.id, member.name)} className="text-xs opacity-50 transition-colors flex items-center gap-1 mt-1"><Phone size={11} />{member.phone}</a>}</div>
                {member.phone && <a href={`tel:${member.phone.replace(/\s/g, '')}`} onClick={() => trackEvent('contact_click', member.id, member.name)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0" style={{ backgroundColor: 'var(--brand-subtle)', color: brand.primary }} aria-label={`${member.name} ara`}><Phone size={16} /></a>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
