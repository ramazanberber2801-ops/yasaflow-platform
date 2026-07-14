import { useEffect, useState, type ReactNode } from 'react';
import { KeyRound, Loader2, LockKeyhole } from 'lucide-react';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { supabase } from '../lib/supabase';

type AccessMode = 'public' | 'mixed' | 'authenticated';
type AccessState = 'loading' | 'allowed' | 'pending' | 'denied';

export function OrganizationAccessGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AccessMode>('public');
  const [state, setState] = useState<AccessState>('loading');

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setState('allowed');
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data: organization } = await client
        .from('organizations')
        .select('app_access_mode')
        .eq('id', DEFAULT_ORGANIZATION_ID)
        .maybeSingle();

      const nextMode = (organization?.app_access_mode || 'public') as AccessMode;
      if (cancelled) return;
      setMode(nextMode);

      if (nextMode !== 'authenticated') {
        setState('allowed');
        return;
      }

      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        setState('denied');
        return;
      }

      const [membershipResult, adminResult] = await Promise.all([
        client
          .from('organization_user_memberships')
          .select('status')
          .eq('organization_id', DEFAULT_ORGANIZATION_ID)
          .eq('user_id', session.user.id)
          .maybeSingle(),
        client
          .from('organization_admins')
          .select('id')
          .eq('organization_id', DEFAULT_ORGANIZATION_ID)
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (adminResult.data) {
        setState('allowed');
        return;
      }
      if (membershipResult.data?.status === 'active') {
        setState('allowed');
        return;
      }
      if (membershipResult.data?.status === 'pending') {
        setState('pending');
        return;
      }
      setState('denied');
    };

    void load();
    const { data } = client.auth.onAuthStateChange(() => void load());
    const refresh = () => void load();
    window.addEventListener('yasaflow-membership-changed', refresh);
    window.addEventListener('yasaflow-organization-settings-changed', refresh);

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
      window.removeEventListener('yasaflow-membership-changed', refresh);
      window.removeEventListener('yasaflow-organization-settings-changed', refresh);
    };
  }, []);

  if (mode !== 'authenticated' || state === 'allowed') return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center px-5" style={{ backgroundColor: 'var(--brand-background, #F4FAFF)', color: 'var(--brand-text, #071B53)' }}>
      <section className="w-full max-w-md rounded-3xl border p-7 text-center shadow-xl" style={{ backgroundColor: 'var(--brand-card, #fff)', borderColor: 'var(--brand-border, #dbeafe)' }}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--brand-subtle, #eff6ff)', color: 'var(--brand-primary, #0A8DFF)' }}>
          {state === 'loading' ? <Loader2 className="animate-spin" size={28} /> : state === 'pending' ? <KeyRound size={28} /> : <LockKeyhole size={28} />}
        </div>
        <h1 className="mt-5 font-serif text-2xl">{state === 'pending' ? 'Venter på godkjenning' : 'Denne appen krever innlogging'}</h1>
        <p className="mt-3 text-sm leading-6 opacity-65">{state === 'pending' ? 'Organisasjonen må godkjenne medlemskapet før innholdet blir tilgjengelig.' : 'Logg inn eller opprett en bruker med organisasjonens invitasjonskode.'}</p>
        <p className="mt-5 rounded-xl border p-3 text-xs opacity-55">Bruk knappen øverst til høyre for å logge inn eller skrive inn invitasjonskode.</p>
      </section>
    </div>
  );
}
