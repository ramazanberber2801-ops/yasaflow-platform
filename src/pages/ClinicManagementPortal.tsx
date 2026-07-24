import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Save, Search, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ClinicRow = {
  id: string;
  name: string;
  organization_type: string | null;
  status: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  slug: string | null;
  domain: string | null;
  live_url: string | null;
  admin_name: string | null;
  admin_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
};

type ClinicForm = {
  name: string;
  status: string;
  subscription_status: string;
  subscription_plan: string;
  address: string;
  phone: string;
  email: string;
};

const statusOptions = ['Prøve', 'Aktiv', 'Deaktivert'];
const subscriptionOptions = ['trial', 'active', 'expired', 'cancelled', 'past_due'];
const planOptions = ['core', 'standard', 'premium'];

function clinicUrl(clinic: ClinicRow) {
  if (clinic.live_url) return clinic.live_url;
  if (clinic.domain) return clinic.domain.startsWith('http') ? clinic.domain : `https://${clinic.domain}`;
  if (clinic.slug) return `https://${clinic.slug}.yasaflow.com`;
  return '';
}

export function ClinicManagementPortal({ onBack }: { onBack: () => void }) {
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<ClinicRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClinicForm>({ name: '', status: 'Prøve', subscription_status: 'trial', subscription_plan: 'core', address: '', phone: '', email: '' });

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.rpc('owner_list_clinics');
    if (loadError) setError(loadError.message);
    else setClinics((data || []) as ClinicRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => clinics.filter((clinic) => {
    const haystack = [clinic.name, clinic.admin_name, clinic.admin_email, clinic.email, clinic.phone, clinic.address, clinic.slug].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = haystack.includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'all' || clinic.subscription_status === filter || clinic.status?.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  }), [clinics, query, filter]);

  const openEditor = (clinic: ClinicRow) => {
    setSelected(clinic);
    setForm({
      name: clinic.name || '',
      status: clinic.status || 'Prøve',
      subscription_status: clinic.subscription_status || 'trial',
      subscription_plan: clinic.subscription_plan || 'core',
      address: clinic.address || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
    });
  };

  const save = async () => {
    if (!supabase || !selected) return;
    setSaving(true);
    setError('');
    const { error: saveError } = await supabase.rpc('owner_update_clinic', {
      p_id: selected.id,
      p_name: form.name,
      p_status: form.status,
      p_subscription_status: form.subscription_status,
      p_subscription_plan: form.subscription_plan,
      p_address: form.address,
      p_phone: form.phone,
      p_email: form.email,
    });
    if (saveError) setError(saveError.message);
    else {
      setSelected(null);
      await load();
    }
    setSaving(false);
  };

  return <main className="mx-auto w-full max-w-6xl p-4 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><ArrowLeft size={16}/> Tilbake til valg</button>
      <div className="flex gap-2">
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={16}/> Oppdater</button>
        <a href="/registrer?type=clinic&source=owner" className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"><Plus size={16}/> Ny klinikk</a>
      </div>
    </div>

    <section className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700"><Sparkles size={23}/></div>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-slate-950">Klinikkoversikt</h1>
          <p className="mt-2 text-sm text-slate-600">Søk, åpne og rediger klinikker fra samme sted.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Søk klinikk" className="w-full rounded-xl border py-3 pl-10 pr-3"/></label>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border px-3 py-3"><option value="all">Alle statuser</option><option value="trial">Prøveperiode</option><option value="active">Aktiv</option><option value="expired">Utløpt</option><option value="past_due">Manglende betaling</option><option value="cancelled">Avsluttet</option><option value="deaktivert">Deaktivert</option></select>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <div className="flex items-center justify-center py-16 text-slate-500"><Loader2 className="mr-2 animate-spin" size={18}/> Henter klinikker...</div> : filtered.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">Ingen klinikker funnet.</div> : <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {filtered.map(clinic => {
          const url = clinicUrl(clinic);
          return <article key={clinic.id} className="rounded-3xl border border-slate-200 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-fuchsia-50 text-fuchsia-700">{clinic.logo_url ? <img src={clinic.logo_url} alt="" className="h-full w-full object-cover"/> : <Sparkles size={22}/>}</div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold text-slate-950">{clinic.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{clinic.address || clinic.admin_email || 'Ingen kontaktinformasjon'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1">{clinic.status || 'Ukjent'}</span><span className="rounded-full bg-fuchsia-50 px-3 py-1 text-fuchsia-700">{clinic.subscription_status || 'trial'} · {clinic.subscription_plan || 'core'}</span></div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => openEditor(clinic)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700"><Pencil size={15}/> Rediger</button>
              {url && <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Åpne klinikk <ExternalLink size={15}/></a>}
            </div>
          </article>;
        })}
      </div>}
    </section>

    {selected && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700">Rediger klinikk</p><h2 className="mt-1 font-serif text-2xl font-semibold">{selected.name}</h2></div><button onClick={()=>setSelected(null)} className="rounded-xl border p-2"><X size={18}/></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="text-sm font-medium">Klinikknavn</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full rounded-xl border p-3"/></label>
          <label><span className="text-sm font-medium">Klinikkstatus</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="mt-1 w-full rounded-xl border p-3">{statusOptions.map(v=><option key={v}>{v}</option>)}</select></label>
          <label><span className="text-sm font-medium">Abonnementsstatus</span><select value={form.subscription_status} onChange={e=>setForm({...form,subscription_status:e.target.value})} className="mt-1 w-full rounded-xl border p-3">{subscriptionOptions.map(v=><option key={v}>{v}</option>)}</select></label>
          <label><span className="text-sm font-medium">Plan</span><select value={form.subscription_plan} onChange={e=>setForm({...form,subscription_plan:e.target.value})} className="mt-1 w-full rounded-xl border p-3">{planOptions.map(v=><option key={v}>{v}</option>)}</select></label>
          <label><span className="text-sm font-medium">Telefon</span><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="mt-1 w-full rounded-xl border p-3"/></label>
          <label className="sm:col-span-2"><span className="text-sm font-medium">E-post</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1 w-full rounded-xl border p-3"/></label>
          <label className="sm:col-span-2"><span className="text-sm font-medium">Adresse</span><textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={3} className="mt-1 w-full rounded-xl border p-3"/></label>
        </div>
        <button disabled={saving} onClick={()=>void save()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{saving ? <Loader2 size={17} className="animate-spin"/> : <Save size={17}/>} Lagre endringer</button>
      </section>
    </div>}
  </main>;
}
