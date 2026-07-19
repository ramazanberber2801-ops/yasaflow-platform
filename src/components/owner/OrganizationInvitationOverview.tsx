import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Clock3, LockKeyhole, Mail, RefreshCw, RotateCw, ShieldCheck } from 'lucide-react';
import {
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
} from '../../lib/organizationInvitationActions';
import { getOrganizationPermissions, type OrganizationRole } from '../../lib/organizationRbac';
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

const roleLabels: Record<OrganizationRole, string> = {
  owner: 'Eier',
  admin: 'Administrator',
  staff: 'Ansatt',
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
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | InvitationStatus>('all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<OrganizationRole | null>(null);
  const canManageInvitations = currentRole === 'owner' || currentRole === 'admin';

  const load = useCallback(async () => {
    if (!supabase || !organizationId) {
      setInvitations([]);
      setCurrentRole(null);
      return;
    }

    setLoading(true);
    setError('');
    const [permissions, invitationsResult] = await Promise.all([
      getOrganizationPermissions(organizationId),
      supabase
        .from('organization_invitations')
        .select('id,email,display_name,role,status,sent_at,expires_at,accepted_at,created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
    ]);

    setCurrentRole(permissions.role);
    if (invitationsResult.error) {
      setError(invitationsResult.error.message || 'Kunne ikke hente invitasjonene.');
      setInvitations([]);
    } else {
      setInvitations((invitationsResult.data || []) as Invitation[]);
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

  const resend = async (invitation: Invitation) => {
    if (!canManageInvitations || actionId) return;
    const confirmed = window.confirm(`Sende en ny invitasjon til ${invitation.email}? Den gamle lenken blir ugyldig.`);
    if (!confirmed) return;

    setActionId(invitation.id);
    setError('');
    setMessage('Sender ny invitasjon...');
    try {
      const result = await resendOrganizationInvitation(invitation.id, organizationId);
      setMessage(`Ny invitasjon er sendt til ${result.email || invitation.email}${result.expiresAt ? ` og utløper ${dateTime(result.expiresAt)}` : ''}.`);
      await load();
    } catch (actionError) {
      setMessage('');
      setError(actionError instanceof Error ? actionError.message : 'Kunne ikke sende invitasjonen på nytt.');
    } finally {
      setActionId(null);
    }
  };

  const revoke = async (invitation: Invitation) => {
    if (!canManageInvitations || actionId) return;
    const confirmed = window.confirm(`Tilbakekalle invitasjonen til ${invitation.email}? Lenken vil slutte å virke med en gang.`);
    if (!confirmed) return;

    setActionId(invitation.id);
    setError('');
    setMessage('Tilbakekaller invitasjonen...');
    try {
      await revokeOrganizationInvitation(invitation.id, organizationId);
      setMessage(`Invitasjonen til ${invitation.email} er tilbakekalt.`);
      await load();
    } catch (actionError) {
      setMessage('');
      setError(actionError instanceof Error ? actionError.message : 'Kunne ikke tilbakekalle invitasjonen.');
    } finally {
      setActionId(null);
    }
  };

  if (!organizationId) return null;

  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Mail size={18} /></div>
          <div><h3 className="font-serif text-lg">Invitasjonsoversikt</h3><p className="text-xs opacity-55">{invitations.length} invitasjoner</p></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading || Boolean(actionId)} className="rounded-xl border p-2 disabled:opacity-50" aria-label="Oppdater invitasjoner"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {!canManageInvitations && currentRole && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <LockKeyhole size={14} /> Rollen {roleLabels[currentRole]} kan se, men ikke administrere invitasjoner.
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {(['all','sent','accepted','expired','failed','revoked'] as const).map((status) => (
          <button key={status} type="button" onClick={() => setFilter(status)} className="rounded-full border px-3 py-1.5 text-xs" style={{ background: filter === status ? 'var(--brand-primary)' : 'white', color: filter === status ? 'var(--brand-primary-text)' : 'var(--brand-text)', borderColor: 'var(--brand-border)' }}>
            {status === 'all' ? `Alle ${invitations.length}` : `${statusLabels[status]} ${counts[status] || 0}`}
          </button>
        ))}
      </div>

      {message && <p aria-live="polite" className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {!error && !loading && visible.length === 0 && <p className="rounded-xl border p-4 text-center text-sm opacity-55">Ingen invitasjoner å vise.</p>}

      <div className="space-y-2">
        {visible.map((invitation) => {
          const status = effectiveStatus(invitation);
          const busy = actionId === invitation.id;
          const canResend = canManageInvitations && ['pending', 'sent', 'expired', 'failed'].includes(status);
          const canRevoke = canManageInvitations && (status === 'pending' || status === 'sent');
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
              {(canResend || canRevoke) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--brand-border)' }}>
                  {canResend && <button type="button" disabled={Boolean(actionId)} onClick={() => void resend(invitation)} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: 'var(--brand-border)' }}><RotateCw size={14} className={busy ? 'animate-spin' : ''} />Send på nytt</button>}
                  {canRevoke && <button type="button" disabled={Boolean(actionId)} onClick={() => void revoke(invitation)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"><Ban size={14} />Tilbakekall</button>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
