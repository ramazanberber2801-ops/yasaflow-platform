import { useEffect, useState } from 'react';
import { Activity, AlertCircle, BellRing, Building2, LayoutDashboard, Loader2, Newspaper, Settings, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActivitiesModule } from '../components/ActivitiesModule';
import { ManualPushModule } from '../components/ManualPushModule';
import { MembersModule } from '../components/MembersModule';
import { NewsModule } from '../components/NewsModule';
import { resolveOrganizationAdminSession, type OrganizationAdminSession } from '../lib/organizationAdminSession';

type PortalSection = 'dashboard' | 'members' | 'news' | 'activities' | 'notifications' | 'administration' | 'settings';

const brand = { primary: 'var(--brand-primary)', background: 'var(--brand-background)', text: 'var(--brand-text)', card: 'var(--brand-card)' };
const mix = (color: string, amount: number, fallback = 'transparent') => `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const sections = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members' as const, label: 'Medlemmer', icon: Users },
  { id: 'news' as const, label: 'Nyheter', icon: Newspaper },
  { id: 'activities' as const, label: 'Aktiviteter', icon: Activity },
  { id: 'notifications' as const, label: 'Varslinger', icon: BellRing },
  { id: 'administration' as const, label: 'Administrasjon', icon: ShieldCheck },
  { id: 'settings' as const, label: 'Innstillinger', icon: Settings },
];

const sectionDescriptions: Record<Exclude<PortalSection, 'dashboard' | 'members' | 'news' | 'activities' | 'notifications'>, string> = {
  administration: 'Administratorer, roller og tilgang bygges som en separat sikkerhetsfunksjon.',
  settings: 'Organisasjonsinnstillinger og profil kobles til denne organisasjonen.',
};

export function OrganizationAdminPortal() {
  const { currentAdmin } = useApp();
  const [activeSection, setActiveSection] = useState<PortalSection>('dashboard');
  const [session, setSession] = useState<OrganizationAdminSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    resolveOrganizationAdminSession()
      .then((resolved) => { if (!cancelled) setSession(resolved); })
      .catch((error) => { if (!cancelled) setSessionError(error instanceof Error ? error.message : 'Kunne ikke hente organisasjonen.'); })
      .finally(() => { if (!cancelled) setSessionLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const administratorName = session?.adminDisplayName || currentAdmin?.displayName || currentAdmin?.display_name || currentAdmin?.username || 'Administrator';

  if (sessionLoading) return <div className="flex min-h-full items-center justify-center p-8" style={{ backgroundColor: brand.background, color: brand.text }}><div className="flex items-center gap-3 text-sm opacity-65"><Loader2 className="animate-spin" size={18} /> Henter organisasjonen din...</div></div>;
  if (!session) return <div className="flex min-h-full items-center justify-center p-4" style={{ backgroundColor: brand.background, color: brand.text }}><section className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: mix(brand.primary, 18) }}><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertCircle size={20} /></div><div><h2 className="font-serif text-xl">Ingen organisasjonstilknytning</h2><p className="mt-2 text-sm leading-6 opacity-65">{sessionError}</p><p className="mt-3 text-xs leading-5 opacity-50">Tilgang til organisasjonsdata er stengt til administratoren er koblet til en gyldig rad i organization_admins.</p></div></div></section></div>;

  return (
    <div className="min-h-full" style={{ backgroundColor: brand.background, color: brand.text }}>
      <section className="border-b px-4 py-5 sm:px-6" style={{ borderColor: mix(brand.primary, 16) }}><div className="mx-auto flex max-w-6xl items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>{session.organizationLogoUrl ? <img src={session.organizationLogoUrl} alt="" className="h-full w-full object-cover" /> : <Building2 size={22} />}</div><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-[0.18em] opacity-45">Administratorportal</p><h2 className="truncate font-serif text-xl sm:text-2xl">{session.organizationName}</h2><p className="mt-0.5 text-xs opacity-55">Innlogget som {administratorName}{session.organizationStatus ? ` · ${session.organizationStatus}` : ''}</p></div></div></section>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="grid grid-cols-3 gap-2 rounded-2xl border bg-white p-2 shadow-sm sm:grid-cols-7 lg:flex lg:flex-col" style={{ borderColor: mix(brand.primary, 16) }} aria-label="Administratorportal">
          {sections.map(({ id, label, icon: Icon }) => { const active = activeSection === id; return <button key={id} type="button" onClick={() => setActiveSection(id)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-xs" style={{ backgroundColor: active ? mix(brand.primary, 12) : 'transparent', color: active ? brand.primary : brand.text }}><Icon size={17} /><span>{label}</span></button>; })}
        </nav>

        <main>
          {activeSection === 'dashboard' ? (
            <div className="space-y-4"><section className="rounded-3xl border p-5 shadow-sm sm:p-6" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16) }}><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><LayoutDashboard size={20} /></div><div><h3 className="font-serif text-xl">Velkommen til {session.organizationName}</h3><p className="mt-1 max-w-2xl text-sm leading-6 opacity-65">Portalen er koblet til organisasjon <strong>{session.organizationId}</strong>. Medlemmer, Nyheter, Aktiviteter og Varslinger er operative moduler.</p></div></div></section><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
              ['Medlemmer', 'Medlemsliste og opprett/rediger er tilgjengelig.', Users],
              ['Nyheter', 'Opprett, rediger og publiser organisasjonens nyheter.', Newspaper],
              ['Aktiviteter', 'Opprett, rediger og publiser aktiviteter.', Activity],
              ['Varslinger', 'Send manuelle push-meldinger og varsler fra innhold.', BellRing],
              ['Administrasjon', 'Roller og tilgang håndteres separat.', ShieldCheck],
              ['Innstillinger', 'Profil og organisasjonsvalg samles her.', Settings],
            ].map(([title, text, Icon]) => <div key={String(title)} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 14) }}><Icon size={18} style={{ color: brand.primary }} /><h4 className="mt-3 text-sm font-semibold">{String(title)}</h4><p className="mt-1 text-xs leading-5 opacity-55">{String(text)}</p></div>)}</section></div>
          ) : activeSection === 'members' ? (
            <MembersModule organizationId={session.organizationId} />
          ) : activeSection === 'news' ? (
            <NewsModule organizationId={session.organizationId} />
          ) : activeSection === 'activities' ? (
            <ActivitiesModule organizationId={session.organizationId} />
          ) : activeSection === 'notifications' ? (
            <ManualPushModule />
          ) : (
            <section className="rounded-3xl border p-6 shadow-sm" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16) }}>{(() => { const current = sections.find((section) => section.id === activeSection); const Icon = current?.icon || LayoutDashboard; return <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><Icon size={20} /></div><div><h3 className="font-serif text-xl">{current?.label}</h3><p className="mt-1 text-sm leading-6 opacity-65">{sectionDescriptions[activeSection as Exclude<PortalSection, 'dashboard' | 'members' | 'news' | 'activities' | 'notifications'>]}</p></div></div>; })()}</section>
          )}
        </main>
      </div>
    </div>
  );
}
