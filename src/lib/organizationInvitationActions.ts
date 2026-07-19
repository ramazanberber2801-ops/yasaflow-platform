import { supabase } from './supabase';

export type InvitationActionResult = {
  invitationId: string;
  status: 'sent' | 'revoked';
  email?: string;
  expiresAt?: string;
};

async function manageInvitation(
  action: 'resend' | 'revoke',
  invitationId: string,
  organizationId: string,
): Promise<InvitationActionResult> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.');

  const { data, error } = await supabase.functions.invoke<InvitationActionResult & { error?: string }>(
    'manage-organization-invitation',
    {
      body: {
        action,
        invitationId,
        organizationId,
        redirectTo: `${window.location.origin}/accept-invitation`,
      },
    },
  );

  if (error) throw new Error(error.message || 'Invitasjonshandlingen mislyktes.');
  if (data?.error) throw new Error(data.error);
  if (!data?.invitationId || !data.status) throw new Error('Invitasjonstjenesten returnerte et ugyldig svar.');
  return data;
}

export function resendOrganizationInvitation(invitationId: string, organizationId: string) {
  return manageInvitation('resend', invitationId, organizationId);
}

export function revokeOrganizationInvitation(invitationId: string, organizationId: string) {
  return manageInvitation('revoke', invitationId, organizationId);
}
