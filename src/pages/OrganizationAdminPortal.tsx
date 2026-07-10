import { useState } from 'react';
import { Activity, BellRing, Building2, LayoutDashboard, Newspaper, Settings, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

type PortalSection = 'dashboard' | 'members' | 'news' | 'activities' | 'administration' | 'settings';

const brand = {
  primary: 'var(--brand-primary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
  card: 'var(--brand-card)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const sections = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members' as const, label: 'Medlemmer', icon: Users },
  { id: 'news' as const, label: 'Nyheter', icon: Newspaper },
  { id: 'activities' as const, label: 'Aktiviteter', icon: Activity },
  { id: 'administration' as const, label: 'Administrasjon', icon: ShieldCheck },
  { id: 'settings' as const, label: 'Innstillinger', icon: Settings },
];

const sectionDescriptions: Record<Exclude<PortalSection, 'dashboard'>, string> = {
  members: 'Medlemsregister og medlemsadministrasjon bygges i neste fase.',
  news: 'Organisasjonsspesifikke nyheter kobles til portalen etter medlemsgrunnlaget.',
  activities: 'Aktiviteter, påmelding og kalender kommer som egen modul.',
  administration: 'Administratorer, roller og tilgang bygges som en separat sikkerhetsfunksjon.',
  settings: 'Organisasjonsinnstillinger og profil kobles til når organisasjonstilknytningen er på plass.',
};

export function OrganizationAdminPortal() {
  const { currentAdmin, settings } = useApp();
  const [activeSection, setActiveSection] = useState<PortalSection>('dashboard');

  const organizationName = settings?.mosqueName || settings?.shortName || 'Din organisasjon';
  const administratorName = currentAdmin?.displayName || currentAdmin?.display_name || currentAdmin?.username || 'Administrator';

  return (
    <div className="min-h-full" style={{ backgroundColor: brand.background, color: brand.text }}>
      <section className="border-b px-4 py-5 sm:px-6" style={{ borderColor: mix(brand.primary, 16) }}>
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-45">Administratorportal</p>
            <h2 className="truncate font-serif text-xl sm:text-2xl">{organizationName}</h2>
            <p className="mt-0.5 text-xs opacity-55">Innlogget som {administratorName}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="grid grid-cols-3 gap-2 rounded-2xl border bg-white p-2 shadow-sm sm:grid-cols-6 lg:flex lg:flex-col" style={{ borderColor: mix(brand.primary, 16) }} aria-label="Administratorportal">
          {sections.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-xs"
                style={{ backgroundColor: active ? mix(brand.primary, 12) : 'transparent', color: active ? brand.primary : brand.text }}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <main>
          {activeSection === 'dashboard' ? (
            <div className="space-y-4">
              <section className="rounded-3xl border p-5 shadow-sm sm:p-6" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16) }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl">Velkommen til administratorportalen</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 opacity-65">Dette er organisasjonens arbeidsområde. Kjernemodulene er klare i navigasjonen og kobles til organisasjonsspesifikke data steg for steg.</p>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ['Medlemmer', 'Medlemsregister blir første operative modul.', Users],
                  ['Nyheter', 'Publiser nyheter til organisasjonens app.', Newspaper],
                  ['Aktiviteter', 'Administrer aktiviteter og senere påmelding.', Activity],
                  ['Varslinger', 'Push-varsler kobles til aktive moduler.', BellRing],
                  ['Administrasjon', 'Roller og tilgang håndteres separat.', ShieldCheck],
                  ['Innstillinger', 'Profil og organisasjonsvalg samles her.', Settings],
                ].map(([title, text, Icon]) => (
                  <div key={String(title)} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 14) }}>
                    <Icon size={18} style={{ color: brand.primary }} />
                    <h4 className="mt-3 text-sm font-semibold">{String(title)}</h4>
                    <p className="mt-1 text-xs leading-5 opacity-55">{String(text)}</p>
                  </div>
                ))}
              </section>
            </div>
          ) : (
            <section className="rounded-3xl border p-6 shadow-sm" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16) }}>
              {(() => {
                const current = sections.find((section) => section.id === activeSection);
                const Icon = current?.icon || LayoutDashboard;
                return (
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl">{current?.label}</h3>
                      <p className="mt-1 text-sm leading-6 opacity-65">{sectionDescriptions[activeSection as Exclude<PortalSection, 'dashboard'>]}</p>
                    </div>
                  </div>
                );
              })()}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
