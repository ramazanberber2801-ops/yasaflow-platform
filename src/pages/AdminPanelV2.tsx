import { X, LogOut, ShieldCheck, Crown, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OwnerOverview } from '../components/OwnerOverview';
import { OrganizationAdminPortal } from './OrganizationAdminPortal';
import { OwnerPanelV2 } from './OwnerPanelV2';

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

  if (!open) return null;

  const canAccessOwner = isOwnerRole(currentAdmin?.role);

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ backgroundColor: brand.background, color: brand.text }}>
      <header className="px-5 py-4 flex items-center justify-between shrink-0 shadow-md" style={{ backgroundColor: brand.secondary, color: brand.secondaryText }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 22) }}>
            <ShieldCheck size={18} style={{ color: brand.primary }} />
          </div>
          <div>
            <h1 className="font-serif text-lg">Yönetim Paneli V2</h1>
            <p className="text-[10px] opacity-55">
              {currentAdmin?.displayName || currentAdmin?.display_name || currentAdmin?.username || 'Admin'} · {canAccessOwner ? 'Owner' : 'Administrator'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: brand.secondaryText }}>
            <LogOut size={14} /> Çıkış
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
            <X size={18} style={{ color: brand.secondaryText }} />
          </button>
        </div>
      </header>

      <div className="flex border-b-2 bg-white shrink-0 overflow-x-auto" style={{ borderColor: mix(brand.primary, 20) }}>
        <div className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-3 text-xs font-medium relative" style={{ color: brand.primary }}>
          {canAccessOwner ? <Crown size={15} /> : <Building2 size={15} />}
          <span>{canAccessOwner ? 'Owner V2' : 'Administratorportal'}</span>
          <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: brand.primary }} />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        {canAccessOwner ? <><OwnerOverview /><OwnerPanelV2 /></> : <OrganizationAdminPortal />}
      </main>
    </div>
  );
}
