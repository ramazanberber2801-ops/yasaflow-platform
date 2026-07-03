import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './pages/AdminPanel';
import { DonationModal } from './components/DonationModal';
import { InstallButton } from './components/InstallButton';
import { InstallGuideModal } from './components/InstallGuideModal';
import { HomePage } from './pages/HomePage';
import { ContactPage } from './pages/ContactPage';
import { SecuritySetupModal } from './components/SecuritySetupModal';
import { supabase } from './lib/supabase';
import type { Page } from './types';
import type { BrowserType, Platform } from './lib/browserDetect';

type PushMessage = {
  id: string;
  title: string;
  body: string;
  expires_at: string;
};

function AppContent() {
  const { isAdmin, isInitialized, currentAdmin } = useApp();
  const [page, setPage] = useState<Page>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [guideBrowser, setGuideBrowser] = useState<BrowserType>('safari');
  const [guidePlatform, setGuidePlatform] = useState<Platform>('ios');
  const [pushMessage, setPushMessage] = useState<PushMessage | null>(null);

  // Enhetlig logikk for å styre panel- og sikkerhetsmodal-visning
  useEffect(() => {
    if (isInitialized && isAdmin) {
      if (currentAdmin && (!currentAdmin.security_question || !currentAdmin.security_answer)) {
        setShowSecuritySetup(true);
        setShowPanel(false);
      } else {
        setShowSecuritySetup(false);
        setShowPanel(true);
      }
    } else {
      setShowSecuritySetup(false);
      setShowPanel(false);
    }
  }, [isInitialized, isAdmin, currentAdmin]);

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
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#2D2A26]/40 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {page === 'home' && <HomePage />}
      {page === 'contact' && <ContactPage />}

      <InstallButton onShowGuide={handleShowGuide} />

      <BottomNav
        current={page}
        onNavigate={setPage}
        onDonate={() => setShowDonate(true)}
        onSecretTrigger={handleSecretTrigger}
      />

      <AdminLoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />

      <AdminPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
      />

      <DonationModal
        open={showDonate}
        onClose={() => setShowDonate(false)}
      />

      <InstallGuideModal
        open={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        browser={guideBrowser}
        platform={guidePlatform}
      />

      {/* Sikkerhetsmodal uten onClose prop da komponenten din ikke støtter den */}
      <SecuritySetupModal
        open={showSecuritySetup}
        admin={currentAdmin}
        onDone={() => {
          setShowSecuritySetup(false);
          setShowPanel(true);
        }}
      />

      {pushMessage && (
        <div className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border-2 border-[#C5A880]/25 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#C5A880]/15 flex items-center justify-center mb-3">
              <span className="text-xl">🔔</span>
            </div>

            <h2 className="font-serif text-xl text-[#2D2A26] mb-2">
              {pushMessage.title}
            </h2>

            <p className="text-sm text-[#2D2A26]/70 whitespace-pre-wrap mb-5">
              {pushMessage.body}
            </p>

            <button
              type="button"
              onClick={() => setPushMessage(null)}
              className="w-full py-3 rounded-xl bg-[#C5A880] text-white text-sm font-medium"
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
