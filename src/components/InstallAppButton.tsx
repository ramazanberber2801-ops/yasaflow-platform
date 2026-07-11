import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DEFAULT_ORGANIZATION_ID = import.meta.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let observer: MutationObserver | null = null;

    const applyDailyInspirationVisibility = (enabled: boolean) => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const dailyHeading = headings.find((heading) =>
        ['Bugünün Ayeti', 'Bugünün Hadisi'].includes((heading.textContent || '').trim()),
      );
      const section = dailyHeading?.closest('section') as HTMLElement | null;
      if (section) section.style.display = enabled ? '' : 'none';
    };

    const loadModule = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('organization_modules')
        .select('enabled')
        .eq('organization_id', DEFAULT_ORGANIZATION_ID)
        .eq('module_id', 'daily_inspiration')
        .maybeSingle();

      const enabled = Boolean(data?.enabled);
      applyDailyInspirationVisibility(enabled);
      observer = new MutationObserver(() => applyDailyInspirationVisibility(enabled));
      observer.observe(document.body, { childList: true, subtree: true });
    };

    void loadModule();
    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    try {
      if (localStorage.getItem('dtim_install_dismissed') === 'true') setDismissed(true);
    } catch { /* ignore */ }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
    trackEvent('install_click');
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('dtim_install_dismissed', 'true'); } catch { /* ignore */ }
  };

  if (installed || dismissed || !deferredPrompt) return null;

  return (
    <div className="px-4 mt-4">
      <div className="rounded-xl border-2 shadow-md p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, var(--brand-secondary), color-mix(in srgb, var(--brand-secondary) 84%, var(--brand-primary) 16%))', borderColor: 'var(--brand-border)', color: 'var(--brand-secondary-text)' }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 22%, transparent)' }}>
          <Download size={20} style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Uygulamayı Yükle</p>
          <p className="text-[11px] opacity-60">Ana ekrana ekleyin, hızlı erişin</p>
        </div>
        <button onClick={handleInstall} className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>Yükle</button>
        <button onClick={handleDismiss} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary-text) 8%, transparent)' }} aria-label="Kapat">
          <X size={15} style={{ color: 'color-mix(in srgb, var(--brand-secondary-text) 55%, transparent)' }} />
        </button>
      </div>
    </div>
  );
}
