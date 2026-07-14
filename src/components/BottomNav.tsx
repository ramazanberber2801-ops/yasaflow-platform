import { Home, HandCoins, Phone } from 'lucide-react';
import { SecretTapDetector } from './SecretTapDetector';
import type { Page } from '../types';

interface BottomNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
  onDonate: () => void;
  onSecretTrigger: () => void;
  showDonation?: boolean;
  showContact?: boolean;
}

export function BottomNav({ current, onNavigate, onDonate, onSecretTrigger, showDonation = true, showContact = true }: BottomNavProps) {
  const inactiveColor = 'color-mix(in srgb, var(--brand-text) 58%, transparent)';
  const activeColor = 'var(--brand-primary)';
  const navBackground = 'color-mix(in srgb, var(--brand-background) 96%, white 4%)';
  const navBorder = 'color-mix(in srgb, var(--brand-primary) 26%, var(--brand-text) 8%)';

  const itemColor = (page: Page) => (current === page ? activeColor : inactiveColor);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t"
      style={{ backgroundColor: navBackground, borderColor: navBorder }}
    >
      <div className="max-w-md mx-auto px-4 pt-2 pb-3 pb-[env(safe-area-inset-bottom)] relative">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center gap-1 py-2 px-6 transition-colors"
          >
            <Home size={22} style={{ color: itemColor('home') }} strokeWidth={current === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium" style={{ color: itemColor('home') }}>
              Ana Sayfa
            </span>
          </button>

          {showDonation && (
            <div className="flex flex-col items-center -mt-6">
              <button
                onClick={onDonate}
                className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4"
                style={{
                  background: 'linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 76%, #000 24%))',
                  boxShadow: '0 10px 20px color-mix(in srgb, var(--brand-primary) 30%, transparent)',
                  borderColor: 'var(--brand-background)',
                }}
                aria-label="Bağış Yap"
              >
                <HandCoins size={26} style={{ color: 'var(--brand-primary-text)' }} />
              </button>
              <span className="text-[10px] font-medium mt-1" style={{ color: activeColor }}>Bağış</span>
            </div>
          )}

          {showContact && (
            <button
              onClick={() => onNavigate('contact')}
              className="flex flex-col items-center gap-1 py-2 px-6 transition-colors"
            >
              <Phone size={22} style={{ color: itemColor('contact') }} strokeWidth={current === 'contact' ? 2.5 : 2} />
              <span className="text-[10px] font-medium" style={{ color: itemColor('contact') }}>
                İletişim
              </span>
            </button>
          )}
        </div>

        <div className="absolute bottom-[env(safe-area-inset-bottom)] right-2 mb-2">
          <SecretTapDetector onTrigger={onSecretTrigger} />
        </div>
      </div>
    </nav>
  );
}
