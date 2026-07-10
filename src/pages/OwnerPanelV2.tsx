import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Building2, Boxes, Crown, ExternalLink, Mail, Plus, Rocket, Save, Search, Send, Server, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

type Organization = {
  id: string;
  name: string;
  type: string;
  country: string;
  language: string;
  status: string;
  hosting: string;
  domain: string;
  liveUrl: string;
  vercelUrl: string;
  supabaseUrl: string;
  adminName: string;
  adminEmail: string;
  memberCount: number;
  themeId: string;
  onboardingStep: string;
};

type ModuleItem = {
  id: string;
  name: string;
  status: string;
  enabled: boolean;
  locked: boolean;
};

const defaultOrganization: Organization = {
  id: 'dtim',
  name: 'Drammen',
  type: 'Moské',
  country: 'Norge',
  language: 'Tyrkisk',
  status: 'Prøve',
  hosting: 'Managed',
  domain: '',
  liveUrl: '/',
  vercelUrl: '',
  supabaseUrl: '',
  adminName: '',
  adminEmail: '',
  memberCount: 0,
  themeId: 'classic-mosque',
  onboardingStep: 'Testing',
};

const defaultModules: ModuleItem[] = [
  { id: 'news', name: 'Nyheter', status: 'Inkludert', enabled: true, locked: true },
  { id: 'activities', name: 'Aktiviteter', status: 'Inkludert', enabled: true, locked: true },
  { id: 'contact', name: 'Kontakt', status: 'Inkludert', enabled: true, locked: true },
  { id: 'push', name: 'Push-varsler', status: 'Aktiv', enabled: true, locked: false },
  { id: 'donation', name: 'Donasjon', status: 'Aktiv', enabled: true, locked: false },
  { id: 'members', name: 'Medlemsregister', status: 'Av', enabled: false, locked: false },
  { id: 'prayer', name: 'Bønnetider', status: 'Av', enabled: false, locked: false },
  { id: 'ayet-hadis', name: 'Ayet / Hadis', status: 'Av', enabled: false, locked: false },
  { id: 'member-card', name: 'Digitalt medlemskort', status: 'Planlagt', enabled: false, locked: false },
];

function normalizeOrganization(row: any): Organization {
  return {
    ...defaultOrganization,
    id: row.id || defaultOrganization.id,
    name: row.name || defaultOrganization.name,
    type: row.organization_type || row.type || defaultOrganization.type,
    country: row.country || defaultOrganization.country,
    language: row.language || defaultOrganization.language,
    status: row.status || defaultOrganization.status,
    hosting: row.hosting_mode || row.hosting || defaultOrganization.hosting,
    domain: row.domain || '',
    liveUrl: row.live_url || row.liveUrl || '/',
    vercelUrl: row.vercel_url || row.vercelUrl || '',
    supabaseUrl: row.supabase_url || row.supabaseUrl || '',
    adminName: row.admin_name || row.adminName || '',
    adminEmail: row.admin_email || row.adminEmail || '',
    memberCount: Number(row.member_count || row.memberCount || 0),
    themeId: row.theme_id || row.themeId || defaultOrganization.themeId,
    onboardingStep: row.onboarding_step || row.onboardingStep || defaultOrganization.onboardingStep,
  };
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><Icon size={18} /></div>
        <h3 className="font-serif text-lg">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] uppercase tracking-wide opacity-45 mb-1">{children}</p>;
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <input type={type} className="w-full px-4 py-3 rounded-xl border bg-white text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select className="w-full px-4 py-3 rounded-xl border bg-white text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>;
}

function StatusMessage({ state, text }: { state: 'idle' | 'saving' | 'success' | 'error' | 'sending' | 'sent'; text: string }) {
  if (!text) return null;
  return <p className={`text-xs rounded-xl px-3 py-2 ${state === 'error' ? 'text-red-700 bg-red-50' : 'bg-black/5'}`}>{text}</p>;
}

function LinkRow({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  const disabled = !value;
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 16), backgroundColor: disabled ? mix(brand.primary, 4, '#FFFFFF') : '#FFFFFF' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}><Icon size={17} /></div>
        <div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="text-[11px] opacity-50 truncate">{value || 'Ikke satt'}</p></div>
      </div>
      <span className="text-[10px] uppercase opacity-50">{disabled ? 'Ikke satt' : 'Åpne'}</span>
    </div>
  );
  if (disabled) return <div className="opacity-75">{content}</div>;
  return <a href={value} target={value.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">{content}</a>;
}

export function OwnerPanelV2() {
  const [organizations, setOrganizations] = useState<Organization[]>([defaultOrganization]);
  const [organization, setOrganization] = useState<Organization>(defaultOrganization);
  const [previousOrganization, setPreviousOrganization] = useState<Organization | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modules, setModules] = useState<ModuleItem[]>(defaultModules);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [inviteState, setInviteState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteMessage, setInviteMessage] = useState('');

  const activeModules = useMemo(() => modules.filter((mod) => mod.enabled).length, [modules]);

  const filteredOrganizations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((org) => [org.name, org.type, org.domain, org.country, org.adminEmail, org.status, org.hosting].join(' ').toLowerCase().includes(q));
  }, [organizations, searchQuery]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('organizations').select('*').order('updated_at', { ascending: false }).then(({ data, error }) => {
      if (error || !data?.length) return;
      const rows = data.map(normalizeOrganization);
      setOrganizations(rows);
      setOrganization(rows[0]);
    });
  }, []);

  const setOrgField = (key: keyof Organization, value: string | number) => setOrganization((prev) => ({ ...prev, [key]: value }));

  const selectOrganization = (org: Organization) => {
    setOrganization(org);
    setIsCreating(false);
    setPreviousOrganization(null);
    setSelectorOpen(false);
    setSearchQuery('');
    setSaveState('idle');
    setSaveMessage('');
    setInviteState('idle');
    setInviteMessage('');
  };

  const startNewOrganization = () => {
    if (!isCreating) setPreviousOrganization(organization);
    setIsCreating(true);
    setSelectorOpen(false);
    setSearchQuery('');
    setSaveState('idle');
    setSaveMessage('');
    setInviteState('idle');
    setInviteMessage('');
    setOrganization({ ...defaultOrganization, id: `org-${Date.now()}`, name: '', type: 'Forening', country: 'Norge', language: 'Norsk', status: 'Prøve', adminName: '', adminEmail: '', domain: '', liveUrl: '', vercelUrl: '', supabaseUrl: '', memberCount: 0, onboardingStep: 'Bestilling' });
  };

  const cancelCreate = () => {
    if (previousOrganization) setOrganization(previousOrganization);
    setIsCreating(false);
    setPreviousOrganization(null);
    setSelectorOpen(false);
    setSearchQuery('');
    setSaveState('idle');
    setSaveMessage('Opprettelse avbrutt.');
    setInviteState('idle');
    setInviteMessage('');
  };

  const persistOrganization = async () => {
    const org = { ...organization, id: organization.id || `org-${Date.now()}`, name: organization.name.trim() || 'Uten navn' };
    setOrganization(org);

    if (!supabase) return org;

    const now = new Date().toISOString();
    const { error: orgError } = await supabase.from('organizations').upsert({
      id: org.id,
      name: org.name,
      organization_type: org.type,
      country: org.country,
      language: org.language,
      status: org.status,
      hosting_mode: org.hosting,
      domain: org.domain || null,
      live_url: org.liveUrl || null,
      vercel_url: org.vercelUrl || null,
      supabase_url: org.supabaseUrl || null,
      theme_id: org.themeId,
      onboarding_step: org.onboardingStep,
      admin_name: org.adminName || null,
      admin_email: org.adminEmail || null,
      member_count: org.memberCount || 0,
      updated_at: now,
    }, { onConflict: 'id' });
    if (orgError) throw orgError;

    const { error: moduleError } = await supabase.from('organization_modules').upsert(modules.map((mod) => ({ organization_id: org.id, module_id: mod.id, enabled: mod.enabled, status: mod.status, updated_at: now })), { onConflict: 'organization_id,module_id' });
    if (moduleError) throw moduleError;

    if (org.adminEmail.trim()) {
      const { error: adminError } = await supabase.from('organization_admins').upsert({ organization_id: org.id, display_name: org.adminName || org.adminEmail, email: org.adminEmail.trim().toLowerCase(), role: 'admin', invitation_status: inviteState === 'sent' ? 'invited' : 'pending', updated_at: now }, { onConflict: 'organization_id,email' });
      if (adminError) throw adminError;
    }

    const { error: stepError } = await supabase.from('organization_provisioning_steps').upsert([
      { step_key: 'order_received', label: 'Bestilling mottatt', status: 'done' },
      { step_key: 'organization_created', label: 'Organisasjon opprettet', status: 'done' },
      { step_key: 'admin_ready', label: 'Admin klar', status: inviteState === 'sent' ? 'invited' : org.adminEmail ? 'pending' : 'waiting' },
      { step_key: 'theme_selected', label: 'Tema valgt', status: org.themeId ? 'done' : 'pending' },
      { step_key: 'published', label: 'Publisering', status: org.onboardingStep === 'Klar' ? 'done' : 'pending' },
    ].map((step) => ({ organization_id: org.id, ...step, updated_at: now })), { onConflict: 'organization_id,step_key' });
    if (stepError) throw stepError;

    setOrganizations((prev) => {
      const exists = prev.some((item) => item.id === org.id);
      return exists ? prev.map((item) => item.id === org.id ? org : item) : [org, ...prev];
    });
    setIsCreating(false);
    setPreviousOrganization(null);
    return org;
  };

  const saveOrganization = async () => {
    setSaveState('saving');
    setSaveMessage(isCreating ? 'Oppretter organisasjon...' : 'Lagrer organisasjon...');
    try {
      await persistOrganization();
      setSaveState('success');
      setSaveMessage(isCreating ? 'Organisasjonen er opprettet.' : 'Organisasjonen er lagret.');
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Kunne ikke lagre organisasjonen.');
    }
  };

  const inviteAdministrator = async () => {
    const email = organization.adminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setInviteState('error');
      setInviteMessage('Skriv inn en gyldig admin e-post først.');
      return;
    }
    if (!supabase) {
      setInviteState('error');
      setInviteMessage('Supabase er ikke konfigurert.');
      return;
    }
    setInviteState('sending');
    setInviteMessage('Sender invitasjon...');
    try {
      const org = await persistOrganization();
      const { data, error } = await supabase.functions.invoke('invite-organization-admin', { body: { organizationId: org.id, email, displayName: org.adminName || email, redirectTo: `${window.location.origin}/` } });
      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(String(data.error));
      setInviteState('sent');
      setInviteMessage(`Invitasjon sendt til ${email}.`);
    } catch (error) {
      setInviteState('error');
      setInviteMessage(error instanceof Error ? error.message : 'Kunne ikke sende invitasjon.');
    }
  };

  const toggleModule = (id: string) => setModules((prev) => prev.map((mod) => {
    if (mod.id !== id || mod.locked) return mod;
    const enabled = !mod.enabled;
    return { ...mod, enabled, status: enabled ? 'Aktiv' : 'Av' };
  }));

  return (
    <div className="p-4 space-y-5" style={{ color: brand.text }}>
      <div className="rounded-3xl p-5 border-2 shadow-sm" style={{ backgroundColor: brand.secondary, color: brand.secondaryText, borderColor: mix(brand.primary, 24) }}>
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 25), color: brand.primary }}><Crown size={20} /></div><div><p className="text-xs opacity-65">Yasaflow</p><h2 className="font-serif text-2xl leading-tight">Owner Dashboard V2</h2><p className="text-[11px] opacity-60">OwnerPanelV2 search + drift active</p></div></div>
      </div>

      <Card title="Organisasjon" icon={Search}>
        <div className="flex gap-2 items-start">
          <div className="relative flex-[1_1_auto] min-w-0">
            <button type="button" onClick={() => setSelectorOpen((open) => !open)} className="w-full min-h-12 px-4 py-2.5 rounded-xl border bg-white text-left flex items-center justify-between gap-3" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
              <span className="min-w-0"><span className="block text-sm font-medium truncate">{isCreating ? 'Ny organisasjon' : organization.name}</span><span className="block text-[11px] opacity-50 truncate">{isCreating ? 'Opprett ny organisasjon' : `${organization.type} · ${organization.status}`}</span></span>
              <span className="text-xs opacity-50 shrink-0">▾</span>
            </button>

            {selectorOpen && (
              <div className="absolute z-40 left-0 right-0 top-full mt-2 rounded-2xl border bg-white p-3 shadow-xl" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
                <TextInput value={searchQuery} onChange={setSearchQuery} placeholder="Søk organisasjon…" />
                <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
                  {filteredOrganizations.length > 0 ? filteredOrganizations.map((org) => (
                    <button key={org.id} type="button" onClick={() => selectOrganization(org)} className="w-full rounded-xl p-3 text-left hover:bg-black/5" style={{ backgroundColor: !isCreating && org.id === organization.id ? mix(brand.primary, 7, '#FFFFFF') : '#FFFFFF' }}>
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <p className="text-[11px] opacity-50 truncate">{org.type} · {org.country} · {org.status} · {org.adminEmail || 'ingen admin e-post'}</p>
                    </button>
                  )) : <p className="px-3 py-4 text-xs opacity-50 text-center">Ingen organisasjoner funnet.</p>}
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={startNewOrganization} className="min-h-12 max-w-[8.5rem] px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs leading-tight font-medium flex items-center justify-center gap-1 shrink-0 whitespace-normal" style={{ backgroundColor: brand.primary, color: brand.primaryText }}><Plus size={14} className="shrink-0" /> <span>Opprett organisasjon</span></button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border bg-white p-4" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Organisasjon</p><p className="font-serif text-xl">{organization.name || 'Ny organisasjon'}</p></div><div className="rounded-2xl border bg-white p-4" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Aktive moduler</p><p className="font-serif text-xl">{activeModules}</p></div></div>

      <Card title="Admin-invitasjon" icon={Mail}><div className="space-y-3"><div><FieldLabel>Admin navn</FieldLabel><TextInput value={organization.adminName} onChange={(value) => setOrgField('adminName', value)} placeholder="Første administrator" /></div><div><FieldLabel>Admin e-post</FieldLabel><TextInput type="email" value={organization.adminEmail} onChange={(value) => { setOrgField('adminEmail', value); setInviteState('idle'); setInviteMessage(''); }} placeholder="admin@organisasjon.no" /></div><button type="button" disabled={inviteState === 'sending' || !organization.adminEmail.trim()} onClick={inviteAdministrator} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: brand.secondary, color: brand.secondaryText }}><Send size={16} /> {inviteState === 'sending' ? 'Sender invitasjon...' : inviteState === 'sent' ? 'Invitasjon sendt' : 'Inviter administrator'}</button><StatusMessage state={inviteState} text={inviteMessage} /></div></Card>

      <Card title="Organisasjon" icon={Building2}><div className="space-y-3"><div><FieldLabel>Organisasjonsnavn</FieldLabel><TextInput value={organization.name} onChange={(value) => setOrgField('name', value)} placeholder="Organisasjonsnavn" /></div><div className="grid grid-cols-2 gap-3"><div><FieldLabel>Type</FieldLabel><SelectInput value={organization.type} onChange={(value) => setOrgField('type', value)}><option>Moské</option><option>Forening</option><option>Kirke</option><option>Idrettslag</option><option>Kultur</option><option>Annen</option></SelectInput></div><div><FieldLabel>Status</FieldLabel><SelectInput value={organization.status} onChange={(value) => setOrgField('status', value)}><option>Aktiv</option><option>Prøve</option><option>Frosset</option></SelectInput></div></div><div className="grid grid-cols-2 gap-3"><div><FieldLabel>Hosting</FieldLabel><SelectInput value={organization.hosting} onChange={(value) => setOrgField('hosting', value)}><option>Managed</option><option>Self Hosted</option></SelectInput></div><div><FieldLabel>Medlemmer</FieldLabel><TextInput type="number" value={organization.memberCount} onChange={(value) => setOrgField('memberCount', Number(value) || 0)} placeholder="0" /></div></div><div><FieldLabel>Domene</FieldLabel><TextInput value={organization.domain} onChange={(value) => setOrgField('domain', value)} placeholder="Domene" /></div><div className="flex gap-2"><button type="button" disabled={saveState === 'saving'} onClick={saveOrganization} className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: brand.primary, color: brand.primaryText }}><Save size={16} /> {saveState === 'saving' ? (isCreating ? 'Oppretter...' : 'Lagrer...') : (isCreating ? 'Opprett organisasjon' : 'Lagre endringer')}</button>{isCreating && <button type="button" onClick={cancelCreate} className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-white border" style={{ borderColor: mix(brand.primary, 25), color: brand.text }}><X size={16} /> Avbryt</button>}</div><StatusMessage state={saveState} text={saveMessage} /></div></Card>

      <Card title="Drift-lenker" icon={ExternalLink}><div className="space-y-3"><div><FieldLabel>Live App URL</FieldLabel><TextInput value={organization.liveUrl} onChange={(value) => setOrgField('liveUrl', value)} placeholder="https://app.organisasjon.no" /></div><div><FieldLabel>Vercel Project URL</FieldLabel><TextInput value={organization.vercelUrl} onChange={(value) => setOrgField('vercelUrl', value)} placeholder="https://vercel.com/..." /></div><div><FieldLabel>Supabase Project URL</FieldLabel><TextInput value={organization.supabaseUrl} onChange={(value) => setOrgField('supabaseUrl', value)} placeholder="https://supabase.com/dashboard/project/..." /></div><p className="text-[11px] opacity-55">GitHub-kodebasen deles av alle organisasjoner og konfigureres ikke per kunde.</p><div className="space-y-2 pt-2"><LinkRow label="Live App" value={organization.liveUrl} icon={ExternalLink} /><LinkRow label="Vercel Project" value={organization.vercelUrl} icon={Rocket} /><LinkRow label="Supabase Project" value={organization.supabaseUrl} icon={Server} /></div></div></Card>

      <Card title="Modulbibliotek" icon={Boxes}><div className="space-y-2">{modules.map((mod) => <button key={mod.id} type="button" disabled={mod.locked} onClick={() => toggleModule(mod.id)} className="w-full rounded-xl border p-3 flex items-center justify-between text-left disabled:cursor-not-allowed" style={{ borderColor: mix(brand.primary, 16), backgroundColor: mod.enabled ? mix(brand.primary, 5, '#FFFFFF') : '#FFFFFF' }}><div><p className="text-sm font-medium">{mod.name}</p><p className="text-[11px] opacity-50">{mod.locked ? 'Core · låst' : mod.enabled ? 'Aktiv' : 'Av'} · {mod.status}</p></div><span className="relative inline-flex h-6 w-11 items-center rounded-full transition" style={{ backgroundColor: mod.enabled ? brand.primary : mix(brand.text, 18) }}><span className="inline-block h-5 w-5 transform rounded-full bg-white transition" style={{ transform: mod.enabled ? 'translateX(22px)' : 'translateX(2px)' }} /></span></button>)}</div></Card>

      <div className="flex items-center gap-2 text-xs opacity-50 pb-4"><ShieldCheck size={14} /> Kun owner/superadmin skal ha tilgang til dette området.</div>
    </div>
  );
}
