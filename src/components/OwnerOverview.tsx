import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Clock3, PauseCircle, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

type OverviewStats = {
  total: number;
  active: number;
  trial: number;
  paused: number;
  pendingInvitations: number;
  readyToPublish: number;
};

const emptyStats: OverviewStats = {
  total: 0,
  active: 0,
  trial: 0,
  paused: 0,
  pendingInvitations: 0,
  readyToPublish: 0,
};

export function OwnerOverview() {
  const [stats, setStats] = useState<OverviewStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    Promise.all([
      supabase.from('organizations').select('status, onboarding_step'),
      supabase.from('organization_admins').select('invitation_status'),
    ]).then(([organizationsResult, adminsResult]) => {
      if (cancelled) return;

      const organizations = organizationsResult.data || [];
      const admins = adminsResult.data || [];

      setStats({
        total: organizations.length,
        active: organizations.filter((org) => org.status === 'Aktiv').length,
        trial: organizations.filter((org) => org.status === 'Prøve').length,
        paused: organizations.filter((org) => org.status === 'Pause').length,
        pendingInvitations: admins.filter((admin) => ['pending', 'invited'].includes(String(admin.invitation_status || ''))).length,
        readyToPublish: organizations.filter((org) => org.onboarding_step === 'Klar').length,
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: 'Totalt', value: stats.total, icon: Building2 },
    { label: 'Aktive', value: stats.active, icon: CheckCircle2 },
    { label: 'Prøve', value: stats.trial, icon: Clock3 },
    { label: 'Pause', value: stats.paused, icon: PauseCircle },
    { label: 'Ventende invitasjoner', value: stats.pendingInvitations, icon: Send },
    { label: 'Klar for publisering', value: stats.readyToPublish, icon: Sparkles },
  ];

  return (
    <section className="px-4 pt-4" style={{ color: brand.text }}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 18) }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}>
                <Icon size={17} />
              </div>
              <span className="text-2xl font-semibold">{loading ? '–' : value}</span>
            </div>
            <p className="text-[11px] leading-tight opacity-60">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
