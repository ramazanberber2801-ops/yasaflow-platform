import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, CalendarDays, CreditCard, Edit3, Loader2, Plus, QrCode, Search, Trash2, Users, X } from 'lucide-react';
import { ActivityAttendancePanel } from './ActivityAttendancePanel';
import { useOrganizationModules } from '../lib/moduleEngine';
import { supabase } from '../lib/supabase';

type Status = 'draft' | 'published' | 'cancelled';
type Item = {
  id: string;
  title: string;
  description: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  capacity: number | null;
  status: Status;
  category: string | null;
  registration_enabled: boolean;
  registration_deadline: string | null;
  is_paid: boolean;
  price_amount: number | null;
  price_currency: string | null;
  payment_url: string | null;
  payment_confirmation_required: boolean;
};
type Form = {
  title: string;
  description: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: string;
  status: Status;
  category: string;
  registration_enabled: boolean;
  registration_deadline: string;
  is_paid: boolean;
  price_amount: string;
  price_currency: string;
  payment_url: string;
  payment_confirmation_required: boolean;
};

const empty: Form = {
  title: '', description: '', activity_date: '', start_time: '', end_time: '', location: '', capacity: '', status: 'draft', category: '',
  registration_enabled: false, registration_deadline: '', is_paid: false, price_amount: '', price_currency: 'NOK', payment_url: '', payment_confirmation_required: true,
};

const statusLabel: Record<Status, string> = { draft: 'Utkast', published: 'Publisert', cancelled: 'Avlyst' };

export function ActivitiesModule({ organizationId }: { organizationId: string }) {
  const { enabled, loading: modulesLoading } = useOrganizationModules(organizationId);
  const arrangementPro = enabled('arrangement-pro', false);
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [attendanceActivity, setAttendanceActivity] = useState<Item | null>(null);

  const load = async () => {
    if (!supabase) { setError('Databasetilkoblingen er ikke tilgjengelig.'); setLoading(false); return; }
    setLoading(true); setError('');
    const { data, error: loadError } = await supabase.from('organization_activities')
      .select('id,title,description,activity_date,start_time,end_time,location,capacity,status,category,registration_enabled,registration_deadline,is_paid,price_amount,price_currency,payment_url,payment_confirmation_required')
      .eq('organization_id', organizationId).order('activity_date').order('start_time');
    if (loadError) setError(loadError.message); else setItems((data || []) as Item[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [organizationId]);
  useEffect(() => { if (!arrangementPro) setAttendanceActivity(null); }, [arrangementPro]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => (status === 'all' || item.status === status) && (!normalized || [item.title, item.description, item.location, item.category].join(' ').toLowerCase().includes(normalized)));
  }, [items, query, status]);

  const closeDialog = () => { if (!saving) { setOpen(false); setEditing(null); } };
  const create = () => {
    setEditing(null); setForm({ ...empty, activity_date: new Date().toISOString().slice(0, 10) }); setError(''); setMessage(''); setOpen(true);
  };
  const edit = (item: Item) => {
    setEditing(item);
    setForm({
      title: item.title, description: item.description || '', activity_date: item.activity_date, start_time: item.start_time?.slice(0, 5) || '', end_time: item.end_time?.slice(0, 5) || '',
      location: item.location || '', capacity: item.capacity == null ? '' : String(item.capacity), status: item.status, category: item.category || '',
      registration_enabled: arrangementPro && item.registration_enabled,
      registration_deadline: arrangementPro && item.registration_deadline ? new Date(item.registration_deadline).toISOString().slice(0, 16) : '',
      is_paid: arrangementPro && Boolean(item.is_paid), price_amount: item.price_amount == null ? '' : String(item.price_amount), price_currency: item.price_currency || 'NOK',
      payment_url: item.payment_url || '', payment_confirmation_required: item.payment_confirmation_required !== false,
    });
    setError(''); setMessage(''); setOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) { setError('Databasetilkoblingen er ikke tilgjengelig.'); return; }
    const title = form.title.trim();
    if (!title) { setError('Tittel er obligatorisk.'); return; }
    if (!form.activity_date) { setError('Dato er obligatorisk.'); return; }
    if (form.start_time && form.end_time && form.end_time <= form.start_time) { setError('Sluttid må være senere enn starttid.'); return; }
    const capacity = form.capacity === '' ? null : Number(form.capacity);
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) { setError('Kapasitet må være et heltall på minst 1.'); return; }
    const registrationEnabled = arrangementPro && form.registration_enabled;
    const paid = registrationEnabled && form.is_paid;
    const priceAmount = form.price_amount === '' ? null : Number(form.price_amount);
    if (paid && (priceAmount === null || Number.isNaN(priceAmount) || priceAmount < 0)) { setError('Legg inn en gyldig pris.'); return; }
    const paymentUrl = form.payment_url.trim();
    if (paid && !paymentUrl) { setError('Legg inn betalingslenke for betalt arrangement.'); return; }
    if (paid) { try { new URL(paymentUrl); } catch { setError('Betalingslenken må være en gyldig URL, for eksempel https://...'); return; } }

    setSaving(true); setError(''); setMessage('');
    const payload = {
      organization_id: organizationId, title, description: form.description.trim() || null, activity_date: form.activity_date,
      start_time: form.start_time || null, end_time: form.end_time || null, location: form.location.trim() || null, capacity,
      category: form.category.trim() || null, registration_enabled: registrationEnabled,
      registration_deadline: registrationEnabled && form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null,
      is_paid: paid, price_amount: paid ? priceAmount : null, price_currency: paid ? (form.price_currency.trim().toUpperCase() || 'NOK') : null,
      payment_url: paid ? paymentUrl : null, payment_confirmation_required: paid && form.payment_confirmation_required,
      status: form.status, visibility: 'public', published_at: form.status === 'published' ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
    };
    const result = editing
      ? await supabase.from('organization_activities').update(payload).eq('id', editing.id).eq('organization_id', organizationId)
      : await supabase.from('organization_activities').insert(payload);
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setOpen(false); setEditing(null); setForm(empty); setMessage(editing ? 'Arrangementet er oppdatert.' : 'Arrangementet er opprettet.'); await load();
  };

  const remove = async (item: Item) => {
    if (!supabase || !window.confirm(`Slette «${item.title}»?`)) return;
    setDeletingId(item.id); setError(''); setMessage('');
    const { error: deleteError } = await supabase.from('organization_activities').delete().eq('id', item.id).eq('organization_id', organizationId);
    setDeletingId('');
    if (deleteError) setError(deleteError.message); else { setMessage('Arrangementet er slettet.'); await load(); }
  };

  if (modulesLoading) return <div className="flex justify-center p-8" role="status" aria-live="polite"><Loader2 className="animate-spin" aria-hidden="true" /><span className="sr-only">Laster moduler</span></div>;

  return <div className="space-y-4">
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest opacity-45">Organisasjonsspesifikke aktiviteter</p><h3 className="font-serif text-2xl">Kalender og arrangementer</h3></div><button type="button" onClick={create} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}><Plus size={17} aria-hidden="true" />Nytt arrangement</button></div>
      {!arrangementPro && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900"><p className="text-sm font-semibold">Arrangement Pro er ikke aktiv</p><p className="mt-1 text-xs leading-5">Vanlige arrangementer er inkludert. Aktiver Arrangement Pro for påmelding, betaling, venteliste, QR-medlemskort, innsjekk og CSV-eksport.</p></div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]"><label className="flex items-center gap-2 rounded-xl border px-3"><Search size={16} aria-hidden="true" /><span className="sr-only">Søk i arrangementer</span><input className="w-full py-3 outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søk i arrangementer" /></label><label><span className="sr-only">Filtrer etter status</span><select className="h-full w-full rounded-xl border px-3" value={status} onChange={(event) => setStatus(event.target.value as 'all' | Status)}><option value="all">Alle statuser</option><option value="published">Publisert</option><option value="draft">Utkast</option><option value="cancelled">Avlyst</option></select></label></div>
    </section>

    {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
    {message && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700" role="status" aria-live="polite">{message}</p>}

    {loading ? <div className="flex justify-center p-8" role="status" aria-live="polite"><Loader2 className="animate-spin" aria-hidden="true" /><span className="sr-only">Laster arrangementer</span></div> : filtered.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center"><Activity className="mx-auto opacity-30" aria-hidden="true" /><p className="mt-2 text-sm opacity-60">Ingen arrangementer funnet.</p></div> : <div className="space-y-3">{filtered.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm" aria-busy={deletingId === item.id}>
      <div className="flex gap-3"><div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><CalendarDays size={17} aria-hidden="true" /><span className="text-xs font-semibold">{item.activity_date.slice(8, 10)}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{item.title}</h4><span className="rounded-full bg-black/5 px-2 py-1 text-[10px]">{statusLabel[item.status]}</span>{item.category && <span className="rounded-full px-2 py-1 text-[10px]" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>{item.category}</span>}{arrangementPro && item.is_paid && <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800"><CreditCard size={11} aria-hidden="true" />Betalt arrangement</span>}</div><p className="mt-1 text-xs opacity-55">{item.activity_date}{item.start_time ? ` · ${item.start_time.slice(0, 5)}` : ''}{item.location ? ` · ${item.location}` : ''}</p>{arrangementPro && item.registration_enabled && <p className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--brand-primary)' }}><Users size={13} aria-hidden="true" />Påmelding aktiv{item.capacity ? ` · ${item.capacity} plasser` : ''}{item.is_paid && item.price_amount != null ? ` · ${item.price_amount} ${item.price_currency || 'NOK'}` : ''}</p>}</div></div>
      <div className={`mt-3 grid gap-2 border-t pt-3 ${arrangementPro ? 'grid-cols-3' : 'grid-cols-2'}`}>{arrangementPro && <button type="button" onClick={() => setAttendanceActivity(item)} disabled={Boolean(deletingId)} className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold disabled:opacity-50" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }} aria-label={`Åpne innsjekk for ${item.title}`}><QrCode size={14} aria-hidden="true" />Innsjekk</button>}<button type="button" onClick={() => edit(item)} disabled={Boolean(deletingId)} className="flex items-center justify-center gap-1 rounded-lg bg-black/5 py-2 text-xs disabled:opacity-50" aria-label={`Rediger ${item.title}`}><Edit3 size={14} aria-hidden="true" />Rediger</button><button type="button" onClick={() => void remove(item)} disabled={Boolean(deletingId)} className="flex items-center justify-center gap-1 rounded-lg bg-red-50 py-2 text-xs text-red-700 disabled:opacity-50" aria-label={`Slett ${item.title}`}>{deletingId === item.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}Slett</button></div>
    </article>)}</div>}

    {arrangementPro && attendanceActivity && <ActivityAttendancePanel organizationId={organizationId} activity={attendanceActivity} onClose={() => setAttendanceActivity(null)} />}

    {open && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="activity-dialog-title">
      <div className="flex items-center justify-between"><h3 id="activity-dialog-title" className="font-serif text-2xl">{editing ? 'Rediger arrangement' : 'Nytt arrangement'}</h3><button type="button" onClick={closeDialog} disabled={saving} className="rounded-full bg-black/5 p-2 disabled:opacity-50" aria-label="Lukk dialog"><X size={18} aria-hidden="true" /></button></div>
      <form onSubmit={save} className="mt-5 space-y-4" aria-busy={saving}>
        <label className="block text-xs font-medium">Tittel *<input required autoFocus className="mt-1 w-full rounded-xl border p-3 text-sm" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label className="block text-xs font-medium">Beskrivelse<textarea className="mt-1 w-full rounded-xl border p-3 text-sm" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-medium">Dato *<input required type="date" className="mt-1 w-full rounded-xl border p-3" value={form.activity_date} onChange={(event) => setForm({ ...form, activity_date: event.target.value })} /></label><label className="text-xs font-medium">Start<input type="time" className="mt-1 w-full rounded-xl border p-3" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} /></label><label className="text-xs font-medium">Slutt<input type="time" className="mt-1 w-full rounded-xl border p-3" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} /></label></div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Sted<input className="mt-1 w-full rounded-xl border p-3" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label className="text-xs font-medium">Kategori<input className="mt-1 w-full rounded-xl border p-3" placeholder="Kurs, møte, sosialt ..." value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label></div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Kapasitet<input type="number" min="1" step="1" className="mt-1 w-full rounded-xl border p-3" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label><label className="text-xs font-medium">Status<select className="mt-1 w-full rounded-xl border p-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })}><option value="draft">Utkast</option><option value="published">Publisert</option><option value="cancelled">Avlyst</option></select></label></div>
        {arrangementPro && <><label className="flex items-start justify-between gap-4 rounded-2xl border p-4"><span><span className="block text-sm font-semibold">Aktiver påmelding</span><span className="block text-xs opacity-55">Besøkende kan melde seg på arrangementet.</span></span><input type="checkbox" className="h-5 w-5" checked={form.registration_enabled} onChange={(event) => setForm({ ...form, registration_enabled: event.target.checked, is_paid: event.target.checked ? form.is_paid : false })} /></label>{form.registration_enabled && <><label className="block text-xs font-medium">Påmeldingsfrist<input type="datetime-local" className="mt-1 w-full rounded-xl border p-3" value={form.registration_deadline} onChange={(event) => setForm({ ...form, registration_deadline: event.target.value })} /></label><label className="flex items-start justify-between gap-4 rounded-2xl border p-4"><span><span className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={16} aria-hidden="true" />Betalt arrangement</span><span className="block text-xs opacity-55">Deltakeren sendes til organisasjonens eksterne betalingsside.</span></span><input type="checkbox" className="h-5 w-5" checked={form.is_paid} onChange={(event) => setForm({ ...form, is_paid: event.target.checked })} /></label>{form.is_paid && <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Pris *<input required type="number" min="0" step="0.01" className="mt-1 w-full rounded-xl border bg-white p-3" value={form.price_amount} onChange={(event) => setForm({ ...form, price_amount: event.target.value })} /></label><label className="text-xs font-medium">Valuta<input maxLength={3} className="mt-1 w-full rounded-xl border bg-white p-3 uppercase" value={form.price_currency} onChange={(event) => setForm({ ...form, price_currency: event.target.value.toUpperCase() })} /></label></div><label className="block text-xs font-medium">Ekstern betalingslenke *<input required type="url" placeholder="https://vipps.no/..." className="mt-1 w-full rounded-xl border bg-white p-3" value={form.payment_url} onChange={(event) => setForm({ ...form, payment_url: event.target.value })} /></label><label className="flex items-start gap-3 rounded-xl bg-white p-3 text-xs"><input type="checkbox" checked={form.payment_confirmation_required} onChange={(event) => setForm({ ...form, payment_confirmation_required: event.target.checked })} /><span>Krev manuell betalingsbekreftelse før påmeldingen godkjennes.</span></label></div>}</>}</>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={closeDialog} disabled={saving} className="rounded-xl border py-3 text-sm disabled:opacity-50">Avbryt</button><button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>{saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <CalendarDays size={16} aria-hidden="true" />}{editing ? 'Lagre endringer' : 'Opprett arrangement'}</button></div>
      </form>
    </div></div>}
  </div>;
}
