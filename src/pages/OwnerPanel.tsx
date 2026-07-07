import {
  Building2,
  Boxes,
  Brush,
  Cloud,
  CreditCard,
  ExternalLink,
  Github,
  LayoutDashboard,
  Palette,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const modules = [
  { name: 'Nyheter', type: 'Core', status: 'Inkludert' },
  { name: 'Arrangementer', type: 'Core', status: 'Inkludert' },
  { name: 'Kontakt', type: 'Core', status: 'Inkludert' },
  { name: 'Donasjon', type: 'Tillegg', status: 'Valgfri' },
  { name: 'Push-varsler', type: 'Tillegg', status: 'Valgfri' },
  { name: 'Bønnetider', type: 'Religiøs', status: 'Valgfri' },
  { name: 'Ayet / Hadis', type: 'Religiøs', status: 'Valgfri' },
  { name: 'Admin Chat', type: 'Premium', status: 'Planlagt' },
];

const quickLinks = [
  { label: 'Live app', url: '/', icon: ExternalLink, note: 'Åpner aktiv app' },
  { label: 'GitHub repo', url: 'https://github.com/ramazanberber2801-ops/dtim', icon: Github, note: 'Kodebase' },
  { label: 'Vercel project', url: '', icon: Rocket, note: 'Legges inn per organisasjon' },
  { label: 'Supabase project', url: '', icon: Server, note: 'Legges inn per organisasjon' },
];

const roadmap = [
  'Opprett organisasjon',
  'Velg Self Hosted / Managed',
  'Velg moduler',
  'Velg branding',
  'Velg theme og layout',
  'Opprett superadmin',
  'Eksporter/importer konfigurasjon',
];

function OwnerCard({ title, value, icon: Icon, note }: any) {
  return (
    <div className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide opacity-50">{title}</p>
          <p className="font-serif text-2xl mt-1">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
          <Icon size={20} />
        </div>
      </div>
      {note && <p className="text-xs opacity-55 mt-3">{note}</p>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: any) {
  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
          <Icon size={18} />
        </div>
        <h3 className="font-serif text-lg">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function OwnerPanel() {
  return (
    <div className="p-4 space-y-5" style={{ color: brand.text }}>
      <div className="rounded-3xl p-5 shadow-sm border-2 overflow-hidden relative" style={{ backgroundColor: brand.secondary, color: brand.secondaryText, borderColor: mix(brand.primary, 24) }}>
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-25" style={{ backgroundColor: brand.primary }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 25), color: brand.primary }}>
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs opacity-65">Yasaflow</p>
              <h2 className="font-serif text-2xl leading-tight">Owner Dashboard</h2>
            </div>
          </div>
          <p className="text-sm opacity-75 max-w-xl">Kontrollsenteret for organisasjoner, moduler, branding, themes, layouts, hosting og pakker.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Branding', 'Modules', 'Themes', 'Layouts', 'Hosting'].map((item) => (
              <span key={item} className="text-[11px] px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OwnerCard title="Organisasjoner" value="1" icon={Building2} note="DTIM er første installasjon." />
        <OwnerCard title="Moduler" value="8" icon={Boxes} note="Core + tillegg + religiøse." />
        <OwnerCard title="Hosting" value="2" icon={Cloud} note="Self Hosted / Managed." />
        <OwnerCard title="Status" value="Plan" icon={Rocket} note="Første Owner-skall er aktivt." />
      </div>

      <SectionCard title="Drift-lenker" icon={ExternalLink}>
        <div className="space-y-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const disabled = !link.url;
            const content = (
              <div className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 16), backgroundColor: disabled ? mix(brand.primary, 4, '#FFFFFF') : '#FFFFFF' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{link.label}</p>
                    <p className="text-[11px] opacity-50">{link.note}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase opacity-50">{disabled ? 'Ikke satt' : 'Åpne'}</span>
              </div>
            );

            return disabled ? (
              <div key={link.label} className="opacity-75">{content}</div>
            ) : (
              <a key={link.label} href={link.url} target={link.url.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">
                {content}
              </a>
            );
          })}
        </div>
        <p className="text-xs opacity-50 mt-3">Senere lagres liveAppUrl, vercelProjectUrl, supabaseProjectUrl og githubRepoUrl per organisasjon.</p>
      </SectionCard>

      <SectionCard title="Opprett organisasjon" icon={Building2}>
        <div className="space-y-3">
          <input disabled className="w-full px-4 py-3 rounded-xl border bg-white text-sm opacity-75" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} placeholder="Organisasjonsnavn" />
          <div className="grid grid-cols-2 gap-3">
            <button disabled className="py-3 rounded-xl text-sm font-medium border" style={{ borderColor: mix(brand.primary, 30), color: brand.text }}><Server size={16} className="inline mr-1" /> Self Hosted</button>
            <button disabled className="py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: brand.primary, color: brand.primaryText }}><Cloud size={16} className="inline mr-1" /> Managed</button>
          </div>
          <p className="text-xs opacity-50">Dette er første visuelle skall. Funksjon kobles til i neste steg.</p>
        </div>
      </SectionCard>

      <SectionCard title="Modulbibliotek" icon={Boxes}>
        <div className="space-y-2">
          {modules.map((mod) => (
            <div key={mod.name} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 16), backgroundColor: mix(brand.primary, 4, '#FFFFFF') }}>
              <div>
                <p className="text-sm font-medium">{mod.name}</p>
                <p className="text-[11px] opacity-50">{mod.type}</p>
              </div>
              <span className="text-[10px] uppercase px-2 py-1 rounded-full" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>{mod.status}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard title="Branding" icon={Palette}>
          <p className="text-sm opacity-65 mb-3">Logo, farger, splash og app-ikon per organisasjon.</p>
          <div className="flex gap-2">
            {[brand.primary, brand.secondary, brand.background, brand.text].map((color, index) => (
              <div key={index} className="w-9 h-9 rounded-full border" style={{ backgroundColor: color, borderColor: mix(brand.primary, 25) }} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Themes & Layouts" icon={Brush}>
          <p className="text-sm opacity-65 mb-3">Arkitektur for Standard, Modern, Tech, Classic og Dashboard-layout.</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['Standard', 'Modern', 'Tech', 'Dashboard'].map((item) => (
              <span key={item} className="rounded-lg border px-3 py-2" style={{ borderColor: mix(brand.primary, 18) }}>{item}</span>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Pakker og abonnement" icon={CreditCard}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Lisens + grunnpakke</span><span className="opacity-55">Planlagt</span></div>
          <div className="flex justify-between"><span>Modulpriser</span><span className="opacity-55">Planlagt</span></div>
          <div className="flex justify-between"><span>Self Hosted / Managed</span><span className="opacity-55">Planlagt</span></div>
          <div className="flex justify-between"><span>Autopay / freezing</span><span className="opacity-55">Senere</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Neste milepæler" icon={LayoutDashboard}>
        <div className="space-y-2">
          {roadmap.map((item, index) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>{index + 1}</div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center gap-2 text-xs opacity-50 pb-4">
        <ShieldCheck size={14} /> Kun superadmin/owner skal ha tilgang til dette området.
      </div>
    </div>
  );
}
