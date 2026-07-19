import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'expired' | 'revoked' | 'failed';

type Invitation = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  status: InvitationStatus;
  sent_at: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

type Props = {
  organizationId: string;
};

const statusLabels: Record<InvitationStatus, string> = {
  pending: 'Venter',
  sent: 'Sendt',
  accepted: 'Akseptert',
  expired: 'Utløpt',
  revoked: 'Tilbakekalt',
  failed: 'Mislyktes',
};

function dateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' });
}

function effectiveStatus(invitation: Invitation): InvitationStatus {
  if ((invitation.status === 'pending' || invitation.status === 'sent') && new Date(invitation.expires_at).getTime() < Date.now()) {
    return 'expired';
  }
  return invitation.status;
}

export function OrganizationInvitationOverview({ organizationId }: Props) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | InvitationStatus>('all');

  const load = useCallback(async () => {
    if (!supabase || !organizationId) {
      setInvitations([]);
      return;
    }

    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('organization_invitations')
      .select('id,email,display_name,role,status,sent_at,expires_at,accepted_at,created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message || 'Kunne ikke hente invitasjonene.');
      setInvitations([]);
    } else {
      setInvitations((data || []) as Invitation[]);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('yasaflow-organization-invitation-sent', refresh);
    return () => window.removeEventListener('yasaflow-organization-invitation-sent', refresh);
  }, [load]);

  const visible = useMemo(() => invitations.filter((item) => filter === 'all' || effectiveStatus(item) === filter), [filter, invitations]);
  const counts = useMemo(() => invitations.reduce<Record<string, number>>((result, item) => {
    const status = effectiveStatus(item);
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {}), [invitations]);

  if (!organizationId) return null;

  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Mail size={18} /></div>
          <div><h3 className="font-serif text-lg">Invitasjonsoversikt</h3><p className="text-xs opacity-55">{invitations.length} invitasjoner</p></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border p-2 disabled:opacity-50" aria-label="Oppdater invitasjoner"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(['all','sent','accepted','expired','failed','revoked'] as const).map((status) => (
          <button key={status} type="button" onClick={() => setFilter(status)} className="rounded-full border px-3 py-1.5 text-xs" style={{ background: filter === status ? 'var(--brand-primary)' : 'white', color: filter === status ? 'var(--brand-primary-text)' : 'var(--brand-text)', borderColor: 'var(--brand-border)' }}>
            {status === 'all' ? `Alle ${invitations.length}` : `${statusLabels[status]} ${counts[status] || 0}`}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {!error && !loading && visible.length === 0 && <p className="rounded-xl border p-4 text-center text-sm opacity-55">Ingen invitasjoner å vise.</p>}

      <div className="space-y-2">
        {visible.map((invitation) => {
          const status = effectiveStatus(invitation);
          return (
            <article key={invitation.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--brand-border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{invitation.display_name || invitation.email}</p><p className="truncate text-xs opacity-55">{invitation.email}</p></div>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: status === 'accepted' ? '#ECFDF3' : status === 'failed' || status === 'expired' ? '#FEF2F2' : 'var(--brand-subtle)', color: status === 'accepted' ? '#067647' : status === 'failed' || status === 'expired' ? '#B42318' : 'var(--brand-text)' }}>{statusLabels[status]}</span>
              </div>
              <div className="mt-3 grid gap-2 text-[11px] opacity-65 sm:grid-cols-3">
                <span className="flex items-center gap-1"><ShieldCheck size={13} />{invitation.role}</span>
                <span className="flex items-center gap-1"><Clock3 size={13} />Sendt {dateTime(invitation.sent_at || invitation.created_at)}</span>
                <span className="flex items-center gap-1"><Clock3 size={13} />{status === 'accepted' ? `Akseptert ${dateTime(invitation.accepted_at)}` : `Utløper ${dateTime(invitation.expires_at)}`}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
