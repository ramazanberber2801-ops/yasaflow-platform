import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

type InvitationInfo = {
  valid: true;
  email: string;
  displayName?: string | null;
  role: string;
  expiresAt: string;
  organization: { id: string; name: string; live_url?: string | null };
};

type Mode = 'create' | 'login';
type State = 'loading' | 'ready' | 'submitting' | 'success' | 'error';

export function AcceptInvitationPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get('token') || '';
  const organizationId = params.get('organization') || '';
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [mode, setMode] = useState<Mode>('create');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState('Kontrollerer invitasjonen...');

  useEffect(() => {
    let cancelled = false;
    const inspect = async () => {
      if (!supabase) {
        setState('error');
        setMessage('Supabase er ikke konfigurert.');
        return;
      }
      if (!token || !organizationId) {
        setState('error');
        setMessage('Invitasjonslenken er ufullstendig.');
        return;
      }
      const { data, error } = await supabase.functions.invoke<InvitationInfo & { error?: string }>(
        'accept-organization-invitation',
        { body: { action: 'inspect', token, organizationId } },
      );
      if (cancelled) return;
      if (error || data?.error || !data?.valid) {
        setState('error');
        setMessage(data?.error || error?.message || 'Invitasjonen kunne ikke kontrolleres.');
        return;
      }
      setInfo(data);
      setState('ready');
      setMessage('');
    };
    void inspect();
    return () => { cancelled = true; };
  }, [organizationId, token]);

  const accept = async () => {
    if (!supabase || !info || state === 'submitting') return;
    if (password.length < 8) {
      setState('error');
      setMessage('Passordet må ha minst 8 tegn.');
      return;
    }
    setState('submitting');
    setMessage(mode === 'login' ? 'Logger inn og aktiverer tilgang...' : 'Oppretter konto og aktiverer tilgang...');

    try {
      let accessToken: string | undefined;
      if (mode === 'login') {
        const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
          email: info.email,
          password,
        });
        if (loginError || !sessionData.session) throw new Error(loginError?.message || 'Kunne ikke logge inn.');
        accessToken = sessionData.session.access_token;
      }

      const { data, error } = await supabase.functions.invoke<{
        accepted?: boolean;
        redirectTo?: string;
        error?: string;
      }>('accept-organization-invitation', {
        body: { action: 'accept', token, organizationId, password: mode === 'create' ? password : undefined },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error || data?.error || !data?.accepted) {
        throw new Error(data?.error || error?.message || 'Kunne ikke godta invitasjonen.');
      }

      if (mode === 'create') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: info.email, password });
        if (loginError) console.warn('Automatic sign-in after invitation acceptance failed', loginError);
      }

      setState('success');
      setMessage('Invitasjonen er godtatt. Du sendes videre...');
      window.setTimeout(() => {
        const target = data.redirectTo && data.redirectTo !== '/' ? data.redirectTo : '/admin';
        window.location.assign(target);
      }, 1200);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Kunne ikke godta invitasjonen.');
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
        {state === 'success' ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Yasaflow</p>
      <h1 className="mt-2 text-2xl font-semibold">Godta administratorinvitasjon</h1>

      {info && <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold">{info.organization.name}</p>
        <p className="mt-1 text-slate-600">Invitert e-post: {info.email}</p>
        <p className="text-slate-500">Utløper {new Date(info.expiresAt).toLocaleString('nb-NO')}</p>
      </div>}

      {state === 'ready' || state === 'submitting' || (state === 'error' && info) ? <>
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button type="button" onClick={() => { setMode('create'); setMessage(''); setState('ready'); }} className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === 'create' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>Ny konto</button>
          <button type="button" onClick={() => { setMode('login'); setMessage(''); setState('ready'); }} className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>Jeg har konto</button>
        </div>
        <label className="mt-5 block text-sm font-medium" htmlFor="invitation-password">Passord</label>
        <div className="relative mt-2">
          <KeyRound className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input id="invitation-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} disabled={state === 'submitting'} className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-slate-900 disabled:opacity-60" placeholder="Minst 8 tegn" />
        </div>
        <button type="button" onClick={() => void accept()} disabled={state === 'submitting'} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">
          <LogIn size={18} />{state === 'submitting' ? 'Behandler...' : mode === 'login' ? 'Logg inn og godta' : 'Opprett konto og godta'}
        </button>
      </> : null}

      {message && <p role={state === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-2xl px-4 py-3 text-sm ${state === 'error' ? 'bg-red-50 text-red-700' : state === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{message}</p>}
    </section>
  </main>;
}
