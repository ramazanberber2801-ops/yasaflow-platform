import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Building2, CreditCard, ExternalLink, Loader2, LogIn, LogOut, Plus, Sparkles, UserPlus } from 'lucide-react';
import { OrganizationAdminPortal } from './OrganizationAdminPortal';
import { supabase } from '../lib/supabase';

type WorkspaceView = 'chooser' | 'organizations' | 'clinics';

function WorkspaceChooser() {
  const [view, setView] = useState<WorkspaceView>('chooser');

  if (view === 'organizations') return <div>
    <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
      <button onClick={() => setView('chooser')} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><ArrowLeft size={16}/> Tilbake til valg</button>
    </div>
    <OrganizationAdminPortal />
  </div>;

  if (view === 'clinics') return <main className="mx-auto w-full max-w-6xl p-4 sm:p-8">
    <button onClick={() => setView('chooser')} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><ArrowLeft size={16}/> Tilbake til valg</button>
    <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700"><Sparkles size={26}/></div>
      <h1 className="mt-5 font-serif text-3xl font-semibold text-slate-950">Klinikker</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Start onboarding for en ny klinikk eller åpne kundens selvregistrering.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <a href="/registrer?type=clinic&source=owner" className="group rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-600 text-white"><Plus size={22}/></div><ExternalLink size={18} className="text-fuchsia-500"/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Onboard ny klinikk</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Fyll ut klinikkdata på vegne av kunden og fortsett til abonnement og aktivering.</p>
        </a>
        <a href="/registrer?type=clinic" className="group rounded-3xl border border-sky-200 bg-sky-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white"><UserPlus size={22}/></div><ExternalLink size={18} className="text-sky-500"/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Kundens selvregistrering</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Åpner den samme registreringsflyten som kunden bruker fra Yasaflow-nettsiden.</p>
        </a>
      </div>
    </div>
  </main>;

  return <main className="mx-auto w-full max-w-6xl p-4 sm:p-8">
    <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Yasaflow portal</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-950 sm:text-4xl">Hva vil du administrere?</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Velg arbeidsområdet du vil åpne. Du trenger ikke logge inn på nytt når du bytter.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <button onClick={() => setView('organizations')} className="rounded-3xl border border-sky-200 bg-sky-50 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white"><Building2 size={23}/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Organisasjoner</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Åpne organisasjonsoversikten og administrer organisasjoner, medlemmer, innhold og innstillinger.</p>
        </button>
        <button onClick={() => setView('clinics')} className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-600 text-white"><Sparkles size={23}/></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Klinikker</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Start klinikk-onboarding og åpne kundens selvregistrering.</p>
        </button>
      </div>
    </div>
  </main>;
}

export function CustomerAccountPortal({ forceOwner: _forceOwner = false }: { forceOwner?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const hasRecoveryToken = window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');
    if (hasRecoveryToken) setRecoveryMode(true);

    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session) && !hasRecoveryToken);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setAuthenticated(false);
        return;
      }
      setAuthenticated(Boolean(session) && !recoveryMode);
    });
    return () => listener.subscription.unsubscribe();
  }, [recoveryMode]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setSubmitting(false);
    if (loginError) setError('Kunne ikke logge inn. Kontroller e-post og passord.');
  };

  const requestPasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    setSubmitting(false);
    if (resetError) setError('Kunne ikke sende e-post for nytt passord. Prøv igjen.');
    else setMessage('Vi har sendt deg en e-post med lenke for å opprette nytt passord.');
  };

  const saveNewPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (newPassword.length < 8) {
      setError('Passordet må ha minst 8 tegn.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (updateError) {
      setError('Kunne ikke lagre det nye passordet. Åpne lenken fra e-posten på nytt.');
      return;
    }
    setRecoveryMode(false);
    setAuthenticated(true);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setAuthenticated(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin" /></div>;

  if (authenticated) return <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-50 border-b bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="font-serif text-xl font-semibold text-slate-900">Yasaflow</a>
        <button onClick={()=>void logout()} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium"><LogOut size={16}/> Logg ut</button>
      </div>
    </header>
    <WorkspaceChooser />
  </div>;

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4">
    <section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-xl">
      <a href="/" className="text-sm font-semibold text-sky-700">← Til Yasaflow</a>
      <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><CreditCard size={25}/></div>

      {recoveryMode ? <>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-slate-950">Opprett nytt passord</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Skriv inn et nytt passord for kontoen din.</p>
        <form onSubmit={saveNewPassword} className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-medium text-slate-700">Nytt passord</span><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-300" /></label>
          {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting?<Loader2 size={17} className="animate-spin"/>:null} Lagre nytt passord</button>
        </form>
      </> : forgotMode ? <>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-slate-950">Glemt passord</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Skriv inn e-postadressen din, så sender vi en sikker lenke.</p>
        <form onSubmit={requestPasswordReset} className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-medium text-slate-700">E-post</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-300" /></label>
          {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message&&<p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting?<Loader2 size={17} className="animate-spin"/>:null} Send lenke</button>
          <button type="button" onClick={()=>{setForgotMode(false);setError('');setMessage('');}} className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700">Tilbake til innlogging</button>
        </form>
      </> : <>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-slate-950">Logg inn</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Logg inn én gang og velg deretter mellom organisasjoner og klinikker.</p>
        <form onSubmit={login} className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-medium text-slate-700">E-post</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-300" /></label>
          <label className="block"><span className="text-sm font-medium text-slate-700">Passord</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-300" /></label>
          {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting?<Loader2 size={17} className="animate-spin"/>:<LogIn size={17}/>} Logg inn</button>
        </form>
        <div className="mt-5 grid gap-3">
          <a href="/registrer?type=clinic" className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white"><Sparkles size={16}/> Opprett klinikk</a>
          <a href="/registrer" className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700"><UserPlus size={16}/> Opprett organisasjon</a>
          <button type="button" onClick={()=>{setForgotMode(true);setError('');setMessage('');}} className="flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700">Glemt passord</button>
        </div>
      </>}
    </section>
  </main>;
}
