import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { detectBrowser, isInstalled, type BrowserType, type Platform } from '../lib/browserDetect';
import { usePWAInstall } from '../lib/usePWAInstall';

interface InstallButtonProps {
  onShowGuide: (browser: BrowserType, platform: Platform) => void;
}

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

/**
 * Smart install button:
 * - On Chromium (Chrome/Edge): uses beforeinstallprompt for native install
 * - On Safari/Samsung/other: opens the installation guide modal
 * - Hidden if app is already installed (standalone mode)
 * - Dismissible by user (remembers dismissal in sessionStorage)
 */
export function InstallButton({ onShowGuide }: InstallButtonProps) {
  const { canInstall, promptInstall } = usePWAInstall();
  const [browserInfo, setBrowserInfo] = useState(() => detectBrowser());
  const [installed, setInstalled] = useState(() => isInstalled());
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('dtim_install_dismissed') === 'true'; } catch { return false; }
  });
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setBrowserInfo(detectBrowser());
    setInstalled(isInstalled());
  }, []);

  if (installed || dismissed) return null;

  if (browserInfo.supportsBeforeInstallPrompt && !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    if (browserInfo.supportsBeforeInstallPrompt && canInstall) {
      setInstalling(true);
      await promptInstall();
      setInstalling(false);
    } else {
      onShowGuide(browserInfo.browser, browserInfo.platform);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem('dtim_install_dismissed', 'true'); } catch { /* noop */ }
  };

  return (
    <div className="fixed top-16 right-3 z-40">
      <div className="relative theme-card rounded-xl shadow-lg border-2 overflow-hidden">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex items-center gap-2.5 pl-4 pr-7 py-2.5 transition-colors disabled:opacity-60"
          style={{ color: brand.text }}
        >
          {installing ? (
            <div
              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: brand.primary, borderTopColor: 'transparent' }}
            />
          ) : (
            <Download size={16} style={{ color: brand.primary }} />
          )}
          <span className="text-xs font-semibold">
            {installing ? 'Yükleniyor...' : 'Uygulamayı Yükle'}
          </span>
        </button>
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--brand-subtle)', color: mix(brand.text, 55) }}
          aria-label="Kapat"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
