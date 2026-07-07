import { useState, useEffect, type FormEvent } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './pages/AdminPanel';
import { DonationModal } from './components/DonationModal';
import { InstallButton } from './components/InstallButton';
import { InstallGuideModal } from './components/InstallGuideModal';
import { HomePage } from './pages/HomePage';
import { ContactPage } from './pages/ContactPage';
import { supabase } from './lib/supabase';
import { useOrganizationModules } from './lib/moduleEngine';
import type { Page } from './types';
import type { BrowserType, Platform } from './lib/browserDetect';

type PushMessage = {
  id: string;
  title: string;
  body: string;
  expires_at: string;
};

function safeColor(value: unknown, fallback: string) {
  const color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function contrastText(hex: string) {
  const value = hex.replace('#', '');
  const n = parseInt(value, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? '#2D2A26' : '#FFFFFF';
}

function RecoveryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (first.length < 6) return setError('En az 6 karakter girin.');
    if (first !== second) return setError('İki giriş aynı değil.');
    if (!supabase) return setError('Sistem bağlantısı yok.');

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: first });
    setBusy(false);

    if (updateError) return setError('Kaydedilemedi: ' + updateError.message);

    setMessage('Kaydedildi. Yeni şifreyle giriş yapabilirsiniz.');
    setFirst('');
    setSecond('');
    window.history.replaceState({}, document.title, window.location.pathname);

    setTimeout(() => {
      void supabase?.auth.signOut();
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[var(--brand-background)] w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ color: 'var(--brand-text)' }}>
        <div className="flex justify-between mb-5">
          <h2 className="font-serif text-xl">Yeni Şifre Belirle</h2>
          <button onClick={onClose} className="text-xl leading-none">×</button>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        {message && <p className="text-green-700 text-xs mb-3">{message}</p>}

        <form onSubmit={submit} className="space-y-4">
          <input type={visible ? 'text' : 'password'} className="w-full p-3 border rounded-xl" placeholder="Yeni şifre" value={first} onChange={(e) => setFirst(e.target.value)} required />
          <input type={visible ? 'text' : 'password'} className="w-full p-3 border rounded-xl" placeholder="Yeni şifre tekrar" value={second} onChange={(e) => setSecond(e.target.value)} required />

          <label className="flex items-center gap-2 text-xs opacity-70">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Şifreyi göster
          </label>

          <button type="submit" disabled={busy} className="w-full p-3 rounded-xl font-medium" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>
            {busy ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAdmin, isInitialized, settings } = useApp();
  const { enabled } = useOrganizationModules('dtim');
  const [page, setPage] = useState<Page>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [guideBrowser, setGuideBrowser] = useState<BrowserType>('safari');
  const [guidePlatform, setGuidePlatform] = useState<Platform>('ios');
  const [pushMessage, setPushMessage] = useState<PushMessage | null>(null);

  const brandPrimary = safeColor(settings?.brandingPrimaryColor, '#C5A880');
  const brandSecondary = safeColor(settings?.brandingSecondaryColor, '#2D2A26');
  const brandBackground = safeColor(settings?.brandingBackgroundColor, '#FAF6F0');
  const brandText = safeColor(settings?.brandingTextColor, '#2D2A26');
  const brandVars = {
    '--brand-primary': brandPrimary,
    '--brand-secondary': brandSecondary,
    '--brand-background': brandBackground,
    '--brand-text': brandText,
    '--brand-primary-text': contrastText(brandPrimary),
    '--brand-secondary-text': contrastText(brandSecondary),
  } as React.CSSProperties;

  const donationEnabled = enabled('donation');
  const contactEnabled = enabled('contact');

  useEffect(() => {
    if (isInitialized && isAdmin) {
      setShowPanel(true);
    } else {
      setShowPanel(false);
    }
  }, [isInitialized, isAdmin]);

  useEffect(() => {
    if (page === 'contact' && !contactEnabled) {
      setPage('home');
    }
  }, [page, contactEnabled]);

  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowRecovery(true);
        setShowLogin(false);
        setShowPanel(false);
      }
    });

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    const type = hash.get('type') || query.get('type');

    if (type === 'recovery') {
      setShowRecovery(true);
      setShowLogin(false);
      setShowPanel(false);
    }

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialized || !supabase) return;

    const params = new URLSearchParams(window.location.search);
    const messageId = params.get('push_message');

    if (!messageId) return;

    supabase
      .from('push_messages')
      .select('id, title, body, expires_at')
      .eq('id', messageId)
      .gt('expires_at', new Date().toISOString())
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Kunne ikke hente push-melding:', error);
          return;
        }

        if (data) {
          setPushMessage(data);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
  }, [isInitialized]);

  const handleSecretTrigger = () => {
    if (isAdmin) {
      setShowPanel(true);
    } else {
      setShowLogin(true);
    }
  };

  const handleShowGuide = (browser: BrowserType, platform: Platform) => {
    setGuideBrowser(browser);
    setGuidePlatform(platform);
    setShowInstallGuide(true);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: brandBackground, color: brandText }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: brandPrimary, borderTopColor: 'transparent' }}></div>
          <p className="text-xs opacity-50 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ ...brandVars, backgroundColor: 'var(--brand-background)', color: 'var(--brand-text)' }}>
      {page === 'home' && <HomePage />}
      {page === 'contact' && contactEnabled && <ContactPage />}

      <InstallButton onShowGuide={handleShowGuide} />

      <BottomNav
        current={page}
        onNavigate={setPage}
        onDonate={() => donationEnabled && setShowDonate(true)}
        onSecretTrigger={handleSecretTrigger}
        showDonation={donationEnabled}
        showContact={contactEnabled}
      />

      <AdminLoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />

      <AdminPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
      />

      {donationEnabled && (
        <DonationModal
          open={showDonate}
          onClose={() => setShowDonate(false)}
        />
      )}

      <InstallGuideModal
        open={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        browser={guideBrowser}
        platform={guidePlatform}
      />

      <RecoveryDialog
        open={showRecovery}
        onClose={() => setShowRecovery(false)}
      />

      {pushMessage && (
        <div className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border-2 shadow-xl" style={{ borderColor: `${brandPrimary}40` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${brandPrimary}26` }}>
              <span className="text-xl">🔔</span>
            </div>

            <h2 className="font-serif text-xl mb-2" style={{ color: brandText }}>
              {pushMessage.title}
            </h2>

            <p className="text-sm opacity-70 whitespace-pre-wrap mb-5" style={{ color: brandText }}>
              {pushMessage.body}
            </p>

            <button
              type="button"
              onClick={() => setPushMessage(null)}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: brandPrimary, color: contrastText(brandPrimary) }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
