import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_KEY = 'yasaflow_install_dismissed';
const LEGACY_INSTALL_DISMISSED_KEY = 'dtim_install_dismissed';

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    try {
      const dismissedValue = localStorage.getItem(INSTALL_DISMISSED_KEY) ?? localStorage.getItem(LEGACY_INSTALL_DISMISSED_KEY);
      if (dismissedValue === 'true') {
        setDismissed(true);
        localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
        localStorage.removeItem(LEGACY_INSTALL_DISMISSED_KEY);
      }
    } catch {
      // Ignore unavailable storage.
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    void trackEvent('install_click');
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    } catch {
      // Ignore unavailable storage.
    }
  };

  if (installed || dismissed || !deferredPrompt) return null;

  return (
    <div className="mt-4 px-4">
      <div className="flex items-center gap-3 rounded-xl border-2 p-4 shadow-md" style={{ background: 'linear-gradient(135deg, var(--brand-secondary), color-mix(in srgb, var(--brand-secondary) 84%, var(--brand-primary) 16%))', borderColor: 'var(--brand-border)', color: 'var(--brand-secondary-text)' }}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 22%, transparent)' }}>
          <Download size={20} style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Uygulamayı Yükle</p>
          <p className="text-[11px] opacity-60">Ana ekrana ekleyin, hızlı erişin</p>
        </div>
        <button onClick={handleInstall} className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>Yükle</button>
        <button onClick={handleDismiss} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary-text) 8%, transparent)' }} aria-label="Kapat">
          <X size={15} style={{ color: 'color-mix(in srgb, var(--brand-secondary-text) 55%, transparent)' }} />
        </button>
      </div>
    </div>
  );
}
