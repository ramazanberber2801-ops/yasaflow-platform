import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Building2, CreditCard, ExternalLink, Loader2, LogIn, LogOut, Plus, Stethoscope, UserPlus } from 'lucide-react';
import { OrganizationAdminPortal } from './OrganizationAdminPortal';
import { supabase } from '../lib/supabase';

type OwnerView = 'chooser' | 'organizations' | 'clinics';

function OwnerWorkspace() {
  const [view, setView] = useState<OwnerView>('chooser');

  if (view === 'organizations') return <div>
    <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
      <button onClick={() => setView('chooser')} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><ArrowLeft size={16}/> Tilbake til valg</button>
    </div>
    <OrganizationAdminPortal />
  </div>;

  if (view === 'clinics') return <main className="mx-auto w-full max-w-6xl p-4 sm:p-8">
    <button onClick={() => setView('chooser')} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><ArrowLeft size={16}/> Tilbake til valg</button>
    <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700"><Stethoscope size={26}/></div>
      <h1 className="mt-5 font-serif text-3xl font-semibold text-slate-950">Klinikk-onboarding</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Dette området er separat fra organisasjonsadministrasjonen. Her kan du starte onboarding for en klinikk, eller åpne den samme registreringsflyten som kundene bruker selv.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <a href="/registrer?type=clinic&source=owner" className="group rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-600 text-white"><Plus size={22}/></div><ExternalLink size={18} className="text-fuchsia-500"/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Onboard ny klinikk</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Fyll ut klinikkdata på vegne av kunden. Kunden kan senere fullføre abonnement og betaling i samme flyt.</p>
        </a>
        <a href="/registrer?type=clinic" className="group rounded-3xl border border-sky-200 bg-sky-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white"><UserPlus size={22}/></div><ExternalLink size={18} className="text-sky-500"/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Kundens selvregistrering</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Åpner nøyaktig samme klinikkflyt kunden bruker fra «Kom i gang». Paddle-checkout kobles til denne flyten senere.</p>
        </a>
      </div>
    </div>
  </main>;

  return <main className="mx-auto w-full max-w-6xl p-4 sm:p-8">
    <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Owner</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-950 sm:text-4xl">Hva vil du administrere?</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Du bruker samme innlogging, men organisasjoner og klinikk-onboarding holdes i to separate arbeidsområder.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <button onClick={() => setView('organizations')} className="rounded-3xl border border-sky-200 bg-sky-50 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white"><Building2 size={23}/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Organisasjoner</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Åpne den eksisterende organisasjonsdelen og administrer organisasjoner uten å blande inn klinikksalg og onboarding.</p>
        </button>
        <button onClick={() => setView('clinics')} className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-600 text-white"><Stethoscope size={23}/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Klinikker</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Start onboarding for nye klinikker og åpne kundens selvregistrering. Begge bruker samme fremtidige Paddle-checkout.</p>
        </button>
      </div>
    </div>
  </main>;
}

export function CustomerAccountPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState('');

  const resolveOwnerRole = async (userId?: string) => {
    if (!supabase || !userId) { setIsOwner(false); return; }
    const { data } = await supabase.from('admins').select('role').eq('auth_user_id', userId).maybeSingle();
    const role = String(data?.role || '').toLowerCase();
    setIsOwner(['owner', 'platform_owner', 'super_admin'].includes(role));
  };

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      setAuthenticated(Boolean(data.session));
      await resolveOwnerRole(data.session?.user.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
      void resolveOwnerRole(session?.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError('');
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (!loginError) await resolveOwnerRole(data.user?.id);
    setSubmitting(false);
    if (loginError) setError('Kunne ikke logge inn. Kontroller e-post og passord.');
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setAuthenticated(false);
    setIsOwner(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin" /></div>;

  if (authenticated) return <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-50 border-b bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="font-serif text-xl font-semibold text-slate-900">Yasaflow</a>
        <button onClick={()=>void logout()} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium"><LogOut size={16}/> Logg ut</button>
      </div>
    </header>
    {isOwner ? <OwnerWorkspace /> : <OrganizationAdminPortal />}
  </div>;

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4">
    <section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-xl">
      <a href="/" className="text-sm font-semibold text-sky-700">← Til Yasaflow</a>
      <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><CreditCard size={25}/></div>
      <h1 className="mt-5 font-serif text-3xl font-semibold text-slate-950">Kundeinnlogging</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Logg inn for å administrere klinikken eller organisasjonen, abonnementet, tilleggsmoduler og fakturaer.</p>
      <form onSubmit={login} className="mt-6 space-y-4">
        <label className="block"><span className="text-sm font-medium text-slate-700">E-post</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-300" /></label>
        <label className="block"><span className="text-sm font-medium text-slate-700">Passord</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-300" /></label>
        {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting?<Loader2 size={17} className="animate-spin"/>:<LogIn size={17}/>} Logg inn</button>
      </form>
      <div className="mt-5 grid gap-3">
        <a href="/registrer?type=clinic" className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white"><Stethoscope size={16}/> Opprett klinikk</a>
        <a href="/registrer" className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700"><UserPlus size={16}/> Opprett organisasjon</a>
        <a href="/?forgot=1" className="flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700">Glemt passord</a>
      </div>
    </section>
  </main>;
}
