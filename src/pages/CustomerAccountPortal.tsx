import { useEffect, useState, type FormEvent } from 'react';
import { CreditCard, Loader2, LogIn, LogOut, Stethoscope, UserPlus } from 'lucide-react';
import { OrganizationAdminPortal } from './OrganizationAdminPortal';
import { supabase } from '../lib/supabase';

export function CustomerAccountPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setAuthenticated(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError('');
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setSubmitting(false);
    if (loginError) setError('Kunne ikke logge inn. Kontroller e-post og passord.');
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
    <OrganizationAdminPortal />
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
