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
      className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md"
      style={{ backgroundColor: navBackground, borderColor: navBorder }}
      aria-label="Hovedmeny"
    >
      <div
        className="relative mx-auto max-w-md px-3"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
      >
        <div className="grid h-[76px] grid-cols-3 items-end">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors"
          >
            <Home size={24} style={{ color: itemColor('home') }} strokeWidth={current === 'home' ? 2.5 : 2} />
            <span className="text-[11px] font-semibold leading-none" style={{ color: itemColor('home') }}>
              Ana Sayfa
            </span>
          </button>

          <div className="relative flex h-[76px] min-w-0 flex-col items-center justify-end">
            {showDonation && (
              <>
                <button
                  type="button"
                  onClick={onDonate}
                  className="absolute -top-7 flex h-[68px] w-[68px] items-center justify-center rounded-full border-4 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 76%, #000 24%))',
                    boxShadow: '0 8px 18px color-mix(in srgb, var(--brand-primary) 28%, transparent)',
                    borderColor: navBackground,
                  }}
                  aria-label="Bağış Yap"
                >
                  <HandCoins size={27} style={{ color: 'var(--brand-primary-text)' }} />
                </button>
                <span className="mb-[7px] text-[11px] font-semibold leading-none" style={{ color: activeColor }}>
                  Bağış
                </span>
              </>
            )}
          </div>

          {showContact ? (
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors"
            >
              <Phone size={24} style={{ color: itemColor('contact') }} strokeWidth={current === 'contact' ? 2.5 : 2} />
              <span className="text-[11px] font-semibold leading-none" style={{ color: itemColor('contact') }}>
                İletişim
              </span>
            </button>
          ) : <div />}
        </div>

        <div className="absolute bottom-2 right-2">
          <SecretTapDetector onTrigger={onSecretTrigger} />
        </div>
      </div>
    </nav>
  );
}
