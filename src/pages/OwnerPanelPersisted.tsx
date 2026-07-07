import { useEffect, useMemo, useState } from 'react';
import { Building2, Boxes, ChevronDown, Cloud, ExternalLink, Github, Plus, Rocket, Search, Server, ShieldCheck, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Organization = { id: string; name: string; status: 'Aktiv' | 'Prøve' | 'Frosset'; hosting: 'Managed' | 'Self Hosted'; domain: string; liveUrl: string; vercelUrl: string; supabaseUrl: string; githubUrl: string };
type ModuleItem = { id: string; name: string; type: string; enabled: boolean; locked?: boolean };
type ModuleCategory = { id: string; title: string; description: string; items: ModuleItem[] };

const brand = { primary: 'var(--brand-primary)', secondary: 'var(--brand-secondary)', text: 'var(--brand-text)', primaryText: 'var(--brand-primary-text)', secondaryText: 'var(--brand-secondary-text)' };
const mix = (color: string, amount: number, fallback = 'transparent') => `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const moduleCategories: ModuleCategory[] = [
  { id: 'core', title: '🏛️ Grunnmoduler', description: 'Basisfunksjoner for de fleste organisasjoner.', items: [
    { id: 'news', name: 'Nyheter', type: 'Core', enabled: true, locked: true }, { id: 'events', name: 'Arrangementer', type: 'Core', enabled: true, locked: true }, { id: 'calendar', name: 'Kalender', type: 'Core', enabled: false }, { id: 'contact', name: 'Kontakt', type: 'Core', enabled: true, locked: true }, { id: 'about', name: 'Om oss', type: 'Core', enabled: false }, { id: 'documents', name: 'Dokumenter', type: 'Core', enabled: false },
  ]},
  { id: 'islamic', title: '🕌 Islamske moduler', description: 'Funksjoner for moskeer og islamske organisasjoner.', items: [
    { id: 'prayer', name: 'Bønnetider', type: 'Islam', enabled: false }, { id: 'jumuah', name: 'Fredagsbønn', type: 'Islam', enabled: false }, { id: 'ramadan', name: 'Ramadan', type: 'Islam', enabled: false }, { id: 'eid', name: 'Eid', type: 'Islam', enabled: false }, { id: 'kurban', name: 'Kurban', type: 'Islam', enabled: false }, { id: 'ayet', name: 'Ayet', type: 'Islam', enabled: false }, { id: 'hadis', name: 'Hadis', type: 'Islam', enabled: false }, { id: 'dua', name: 'Du’a', type: 'Islam', enabled: false }, { id: 'qibla', name: 'Qibla', type: 'Islam', enabled: false }, { id: 'islamic-calendar', name: 'Islamsk kalender', type: 'Islam', enabled: false },
  ]},
  { id: 'members', title: '👥 Medlemmer', description: 'Medlemsregister, roller og frivillige.', items: [
    { id: 'members', name: 'Medlemsregister', type: 'Medlem', enabled: false }, { id: 'volunteers', name: 'Frivillige', type: 'Medlem', enabled: false }, { id: 'board', name: 'Styret', type: 'Medlem', enabled: true }, { id: 'roles', name: 'Roller', type: 'Medlem', enabled: false },
  ]},
  { id: 'finance', title: '💰 Økonomi', description: 'Donasjoner, kontingent og sponsor.', items: [
    { id: 'donation', name: 'Donasjon', type: 'Økonomi', enabled: true }, { id: 'zakat', name: 'Zakat', type: 'Økonomi', enabled: false }, { id: 'sadaqah', name: 'Sadaqah', type: 'Økonomi', enabled: false }, { id: 'membership-fee', name: 'Medlemskontingent', type: 'Økonomi', enabled: false }, { id: 'sponsor', name: 'Sponsor', type: 'Økonomi', enabled: false },
  ]},
  { id: 'education', title: '📚 Undervisning', description: 'Kurs, sohbet og undervisningsinnhold.', items: [
    { id: 'sohbet', name: 'Sohbet', type: 'Undervisning', enabled: true }, { id: 'courses', name: 'Kurs', type: 'Undervisning', enabled: false }, { id: 'quran-education', name: 'Koranundervisning', type: 'Undervisning', enabled: false }, { id: 'kids-youth', name: 'Barn og ungdom', type: 'Undervisning', enabled: false }, { id: 'video-archive', name: 'Videoarkiv', type: 'Undervisning', enabled: false },
  ]},
  { id: 'communication', title: '📢 Kommunikasjon', description: 'Varsler, meldinger og kontakt med brukere.', items: [
    { id: 'push', name: 'Push-varsler', type: 'Kommunikasjon', enabled: true }, { id: 'chat', name: 'Chat', type: 'Kommunikasjon', enabled: false }, { id: 'messages', name: 'Meldinger', type: 'Kommunikasjon', enabled: false }, { id: 'email', name: 'E-post', type: 'Kommunikasjon', enabled: false },
  ]},
  { id: 'design', title: '🎨 Design', description: 'Branding, tema og layout.', items: [
    { id: 'branding', name: 'Branding', type: 'Design', enabled: true }, { id: 'themes', name: 'Tema', type: 'Design', enabled: false }, { id: 'layouts', name: 'Layout', type: 'Design', enabled: false }, { id: 'splash', name: 'Splash', type: 'Design', enabled: false }, { id: 'icons', name: 'Ikoner', type: 'Design', enabled: false },
  ]},
  { id: 'admin', title: '⚙️ Administrasjon', description: 'Admin, import, eksport og integrasjoner.', items: [
    { id: 'admins', name: 'Administratorer', type: 'Admin', enabled: true }, { id: 'export', name: 'Eksport', type: 'Admin', enabled: false }, { id: 'import', name: 'Import', type: 'Admin', enabled: false }, { id: 'api', name: 'API', type: 'Admin', enabled: false }, { id: 'integrations', name: 'Integrasjoner', type: 'Admin', enabled: false },
  ]},
  { id: 'analytics', title: '📊 Analyse', description: 'Statistikk, aktivitet og rapporter.', items: [
    { id: 'stats', name: 'Statistikk', type: 'Analyse', enabled: true }, { id: 'reports', name: 'Rapporter', type: 'Analyse', enabled: false }, { id: 'activity', name: 'Aktivitet', type: 'Analyse', enabled: false },
  ]},
];

const fallbackOrg: Organization = { id: 'dtim', name: 'DTIM', status: 'Aktiv', hosting: 'Managed', domain: 'dtim.no', liveUrl: '/', vercelUrl: '', supabaseUrl: '', githubUrl: 'https://github.com/ramazanberber2801-ops/dtim' };
const emptyOrg: Organization = { id: '', name: '', status: 'Prøve', hosting: 'Managed', domain: '', liveUrl: '', vercelUrl: '', supabaseUrl: '', githubUrl: '' };
const flatDefaults = moduleCategories.flatMap((cat) => cat.items);
const fromDb = (row: any): Organization => ({ id: row.id, name: row.name || '', status: row.status || 'Prøve', hosting: row.hosting || 'Managed', domain: row.domain || '', liveUrl: row.live_url || '', vercelUrl: row.vercel_url || '', supabaseUrl: row.supabase_url || '', githubUrl: row.github_url || '' });
const toDb = (org: Organization) => ({ id: org.id, name: org.name, status: org.status, hosting: org.hosting, domain: org.domain, live_url: org.liveUrl, vercel_url: org.vercelUrl, supabase_url: org.supabaseUrl, github_url: org.githubUrl });

function Card({ title, value, note, icon: Icon }: any) { return <div className="rounded-2xl border-2 bg-white p-4" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] uppercase opacity-50">{title}</p><p className="font-serif text-2xl mt-1">{value}</p></div><div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><Icon size={20} /></div></div>{note && <p className="text-xs opacity-55 mt-3">{note}</p>}</div>; }
function Section({ title, icon: Icon, children }: any) { return <section className="rounded-2xl border-2 bg-white p-4" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}><div className="flex items-center gap-2 mb-4"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><Icon size={18} /></div><h3 className="font-serif text-lg">{title}</h3></div>{children}</section>; }
function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <input className="w-full px-4 py-3 rounded-xl border bg-white text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />; }

export function OwnerPanel() {
  const [orgs, setOrgs] = useState<Organization[]>([fallbackOrg]);
  const [selectedId, setSelectedId] = useState('dtim');
  const [form, setForm] = useState<Organization>(fallbackOrg);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dbStatus, setDbStatus] = useState('Lokal fallback');
  const [moduleStatus, setModuleStatus] = useState('Lokal fallback');
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ModuleItem[]>(flatDefaults);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ core: true, islamic: true });

  const selected = orgs.find((org) => org.id === selectedId) || orgs[0];
  const activeModules = modules.filter((mod) => mod.enabled).length;
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return orgs.filter((org) => !q || [org.name, org.domain, org.status, org.hosting].some((v) => v.toLowerCase().includes(q))); }, [orgs, search]);

  useEffect(() => { void loadOrgs(); }, []);
  useEffect(() => { if (selectedId) void loadModules(selectedId); }, [selectedId]);

  async function loadOrgs() {
    if (!supabase) return;
    const { data, error } = await supabase.from('organizations').select('*').order('name', { ascending: true });
    if (error) { setDbStatus('Supabase-tabell mangler'); return; }
    const loaded = (data || []).map(fromDb);
    if (loaded.length > 0) { setOrgs(loaded); setSelectedId(loaded[0].id); setForm(loaded[0]); }
    setDbStatus('Koblet til Supabase');
  }

  async function loadModules(orgId: string) {
    if (!supabase) return;
    const { data, error } = await supabase.from('organization_modules').select('module_id, enabled').eq('organization_id', orgId);
    if (error) { setModuleStatus('Modultabell mangler'); return; }
    const dbMap = new Map((data || []).map((row: any) => [row.module_id, row.enabled]));
    setModules(flatDefaults.map((mod) => ({ ...mod, enabled: mod.locked ? true : Boolean(dbMap.get(mod.id) ?? mod.enabled) })));
    setModuleStatus('Moduler lagres i Supabase');
  }

  async function persistModule(orgId: string, moduleId: string, enabled: boolean) {
    if (!supabase) return;
    const { data, error: findError } = await supabase.from('organization_modules').select('id').eq('organization_id', orgId).eq('module_id', moduleId).limit(1);
    if (findError) { setModuleStatus('Modullagring feilet'); alert('Modultabellen er ikke klar: ' + findError.message); return; }
    const existingId = data?.[0]?.id;
    const result = existingId
      ? await supabase.from('organization_modules').update({ enabled }).eq('id', existingId)
      : await supabase.from('organization_modules').insert({ organization_id: orgId, module_id: moduleId, enabled });
    if (result.error) { setModuleStatus('Modullagring feilet'); alert('Modul ble bare endret lokalt: ' + result.error.message); return; }
    setModuleStatus('Moduler lagres i Supabase');
  }

  function choose(org: Organization) { setSelectedId(org.id); setForm(org); setOpen(false); setSearch(''); }
  function newOrg() { const org = { ...emptyOrg, id: `org-${Date.now()}`, name: 'Ny organisasjon' }; setOrgs((prev) => [...prev, org]); choose(org); }
  async function saveOrg() { const clean = { ...form, id: form.id || `org-${Date.now()}`, name: form.name.trim() || 'Uten navn' }; setSaving(true); if (supabase) { const { error } = await supabase.from('organizations').upsert(toDb(clean), { onConflict: 'id' }); setDbStatus(error ? 'Supabase-lagring feilet' : 'Koblet til Supabase'); if (error) alert('Kun lokal lagring: ' + error.message); } setSaving(false); setOrgs((prev) => prev.some((org) => org.id === clean.id) ? prev.map((org) => org.id === clean.id ? clean : org) : [...prev, clean]); setSelectedId(clean.id); setForm(clean); }
  async function toggleModule(id: string) { const target = modules.find((mod) => mod.id === id); if (!target || target.locked) return; const enabled = !target.enabled; setModules((prev) => prev.map((mod) => mod.id === id ? { ...mod, enabled } : mod)); await persistModule(selectedId, id, enabled); }
  const moduleFor = (id: string) => modules.find((mod) => mod.id === id);
  const links = [{ label: 'Live app', url: selected?.liveUrl || '/', icon: ExternalLink, note: selected?.domain || 'App' }, { label: 'GitHub repo', url: selected?.githubUrl || '', icon: Github, note: 'Kodebase' }, { label: 'Vercel project', url: selected?.vercelUrl || '', icon: Rocket, note: 'Deployment' }, { label: 'Supabase project', url: selected?.supabaseUrl || '', icon: Server, note: 'Database' }];

  return <div className="p-4 space-y-5" style={{ color: brand.text }}>
    <div className="rounded-3xl p-5 border-2 relative overflow-hidden" style={{ backgroundColor: brand.secondary, color: brand.secondaryText, borderColor: mix(brand.primary, 24) }}><div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-25" style={{ backgroundColor: brand.primary }} /><div className="relative space-y-4"><div className="flex items-center gap-2"><div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 25), color: brand.primary }}><Sparkles size={20} /></div><div><p className="text-xs opacity-65">Yasaflow</p><h2 className="font-serif text-2xl">Owner Dashboard</h2></div></div><button type="button" onClick={() => setOpen(true)} className="w-full rounded-2xl border px-4 py-3 text-left flex items-center justify-between gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.14)' }}><div><p className="text-[10px] uppercase opacity-55">Aktiv organisasjon</p><p className="font-serif text-xl">{selected?.name}</p><p className="text-xs opacity-65">{selected?.status} · {selected?.hosting} · {activeModules} moduler</p></div><ChevronDown size={18} /></button><p className="text-[11px] opacity-55">Database: {dbStatus} · {moduleStatus}</p></div></div>
    {open && <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-3"><div className="w-full max-w-lg max-h-[82vh] rounded-3xl bg-white shadow-2xl overflow-hidden" style={{ color: brand.text }}><div className="p-4 border-b flex items-center justify-between" style={{ borderColor: mix(brand.primary, 18) }}><div><p className="text-xs opacity-50">Yasaflow Owner</p><h3 className="font-serif text-xl">Velg organisasjon</h3></div><button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 10) }}><X size={18} /></button></div><div className="p-4"><div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-45" /><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} placeholder="Søk organisasjon..." /></div></div><div className="px-4 pb-4 space-y-2 overflow-y-auto max-h-[42vh]">{filtered.map((org) => <button key={org.id} type="button" onClick={() => choose(org)} className="w-full rounded-2xl border p-3 text-left" style={{ borderColor: org.id === selectedId ? brand.primary : mix(brand.primary, 16), backgroundColor: org.id === selectedId ? mix(brand.primary, 8, '#FFFFFF') : '#FFFFFF' }}><div className="flex items-center justify-between gap-3"><div><p className="font-serif text-base">{org.name}</p><p className="text-xs opacity-50">{org.domain || 'Ingen domene'} · {org.hosting}</p></div><span className="text-[10px] uppercase px-2 py-1 rounded-full" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>{org.status}</span></div></button>)}</div><div className="p-4 border-t" style={{ borderColor: mix(brand.primary, 18) }}><button type="button" onClick={newOrg} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: brand.primary, color: brand.primaryText }}><Plus size={16} /> Ny organisasjon</button></div></div></div>}
    <div className="grid grid-cols-2 gap-3"><Card title="Organisasjoner" value={orgs.length} icon={Building2} note={`Valgt: ${selected?.name}`} /><Card title="Aktive moduler" value={activeModules} icon={Boxes} note="Lagres per organisasjon" /><Card title="Hosting" value={selected?.hosting} icon={Cloud} note={selected?.status} /><Card title="Database" value={moduleStatus.includes('Supabase') ? 'DB' : 'Lokal'} icon={Rocket} note={moduleStatus} /></div>
    <Section title="Rediger organisasjon" icon={Building2}><div className="space-y-3"><Input value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Organisasjonsnavn" /><Input value={form.domain} onChange={(v) => setForm((p) => ({ ...p, domain: v }))} placeholder="Domene" /><Input value={form.liveUrl} onChange={(v) => setForm((p) => ({ ...p, liveUrl: v }))} placeholder="Live app URL" /><Input value={form.vercelUrl} onChange={(v) => setForm((p) => ({ ...p, vercelUrl: v }))} placeholder="Vercel project URL" /><Input value={form.supabaseUrl} onChange={(v) => setForm((p) => ({ ...p, supabaseUrl: v }))} placeholder="Supabase project URL" /><Input value={form.githubUrl} onChange={(v) => setForm((p) => ({ ...p, githubUrl: v }))} placeholder="GitHub repo URL" /><div className="grid grid-cols-2 gap-3"><select className="px-4 py-3 rounded-xl border bg-white text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} value={form.hosting} onChange={(e) => setForm((p) => ({ ...p, hosting: e.target.value as Organization['hosting'] }))}><option>Managed</option><option>Self Hosted</option></select><select className="px-4 py-3 rounded-xl border bg-white text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Organization['status'] }))}><option>Aktiv</option><option>Prøve</option><option>Frosset</option></select></div><button type="button" onClick={saveOrg} disabled={saving} className="w-full py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: brand.primary, color: brand.primaryText }}>{saving ? 'Lagrer...' : 'Lagre organisasjon'}</button></div></Section>
    <Section title="Drift-lenker" icon={ExternalLink}><div className="space-y-2">{links.map((link) => { const Icon = link.icon; const disabled = !link.url; const content = <div className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 16), backgroundColor: disabled ? mix(brand.primary, 4, '#FFFFFF') : '#FFFFFF' }}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}><Icon size={17} /></div><div><p className="text-sm font-medium">{link.label}</p><p className="text-[11px] opacity-50">{link.note}</p></div></div><span className="text-[10px] uppercase opacity-50">{disabled ? 'Ikke satt' : 'Åpne'}</span></div>; return disabled ? <div key={link.label} className="opacity-75">{content}</div> : <a key={link.label} href={link.url} target={link.url.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">{content}</a>; })}</div></Section>
    <Section title="Modulbibliotek" icon={Boxes}><div className="space-y-3">{moduleCategories.map((cat) => { const categoryActive = cat.items.filter((item) => moduleFor(item.id)?.enabled).length; const isOpen = !!openCats[cat.id]; return <div key={cat.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: mix(brand.primary, 16) }}><button type="button" onClick={() => setOpenCats((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))} className="w-full p-3 flex items-center justify-between gap-3 text-left" style={{ backgroundColor: mix(brand.primary, 5, '#FFFFFF') }}><div><p className="font-serif text-base">{cat.title}</p><p className="text-xs opacity-50">{cat.description}</p></div><span className="text-[11px] px-2 py-1 rounded-full" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>{categoryActive}/{cat.items.length}</span></button>{isOpen && <div className="p-2 space-y-2">{cat.items.map((item) => { const current = moduleFor(item.id) || item; return <button key={item.id} type="button" onClick={() => toggleModule(item.id)} disabled={current.locked} className="w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left disabled:cursor-not-allowed" style={{ borderColor: mix(brand.primary, 12), backgroundColor: current.enabled ? mix(brand.primary, 4, '#FFFFFF') : '#FFFFFF' }}><div><p className="text-sm font-medium">{item.name}</p><p className="text-[11px] opacity-50">{item.type}{current.locked ? ' · låst core' : ''}</p></div><span className="relative inline-flex h-6 w-11 items-center rounded-full" style={{ backgroundColor: current.enabled ? brand.primary : mix(brand.text, 18) }}><span className="inline-block h-5 w-5 rounded-full bg-white" style={{ transform: current.enabled ? 'translateX(22px)' : 'translateX(2px)' }} /></span></button>; })}</div>}</div>; })}</div><p className="text-xs opacity-50 mt-3">{moduleStatus}</p></Section>
    <div className="flex items-center gap-2 text-xs opacity-50 pb-4"><ShieldCheck size={14} /> Kun superadmin/owner skal ha tilgang til dette området.</div>
  </div>;
}
