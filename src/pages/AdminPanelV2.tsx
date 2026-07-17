import { X, LogOut, ShieldCheck, Crown, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OwnerOverview } from '../components/OwnerOverview';
import { OwnerThemeManager } from '../components/OwnerThemeManager';
import { OrganizationAdminPortal } from './OrganizationAdminPortal';
import { OwnerPanelV2 } from './OwnerPanelV2';
import { useAppI18n } from '../lib/appI18n';
import { getAdminShellCopy } from '../lib/appUiCopy';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const isOwnerRole = (role?: string) => ['owner', 'super_admin', 'superadmin'].includes(String(role || '').trim());

export function AdminPanelV2({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentAdmin, logout } = useApp();
  const { language, direction } = useAppI18n();
  const text = getAdminShellCopy(language);

  if (!open) return null;

  const canAccessOwner = isOwnerRole(currentAdmin?.role);
  const administratorName = currentAdmin?.displayName || currentAdmin?.display_name || currentAdmin?.username || text.administrator;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div dir={direction} className="fixed inset-0 z-[80] flex min-h-0 flex-col overflow-hidden" style={{ backgroundColor: brand.background, color: brand.text }}>
      <header
        className="shrink-0 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-md sm:px-5 sm:py-4"
        style={{ backgroundColor: brand.secondary, color: brand.secondaryText }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: mix(brand.primary, 22) }}>
              <ShieldCheck size={18} style={{ color: brand.primary }} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-base sm:text-lg">{text.title}</h1>
              <p className="truncate text-[10px] opacity-60">
                {administratorName} · {canAccessOwner ? text.owner : text.administrator}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleLogout}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs sm:px-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: brand.secondaryText }}
              aria-label={text.logout}
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">{text.logout}</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
              aria-label={text.close}
            >
              <X size={18} style={{ color: brand.secondaryText }} />
            </button>
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b-2 bg-white" style={{ borderColor: mix(brand.primary, 20) }}>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium" style={{ color: brand.primary }}>
          {canAccessOwner ? <Crown size={15} /> : <Building2 size={15} />}
          <span>{canAccessOwner ? text.ownerPanel : text.administratorPortal}</span>
        </div>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-7xl">
          {canAccessOwner ? (
            <>
              <OwnerOverview />
              <OwnerPanelV2 />
              <OwnerThemeManager />
            </>
          ) : (
            <OrganizationAdminPortal />
          )}
        </div>
      </main>
    </div>
  );
}
