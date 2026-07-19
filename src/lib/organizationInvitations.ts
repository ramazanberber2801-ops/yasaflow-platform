import { supabase } from './supabase';

export type OrganizationInvitationRequest = {
  organizationId: string;
  organizationName: string;
  adminName?: string;
  adminEmail: string;
  redirectTo?: string;
};

export type OrganizationInvitationResult = {
  invitationId: string;
  email: string;
  expiresAt: string;
  status: 'sent';
};

type InvitationFunctionResponse = {
  invitationId?: string;
  email?: string;
  expiresAt?: string;
  status?: string;
  error?: string;
};

export async function sendOrganizationInvitation(
  request: OrganizationInvitationRequest,
): Promise<OrganizationInvitationResult> {
  if (!supabase) {
    throw new Error('Supabase er ikke konfigurert.');
  }

  const email = request.adminEmail.trim().toLowerCase();
  if (!email) {
    throw new Error('Administratorens e-post mangler.');
  }

  const { data, error } = await supabase.functions.invoke<InvitationFunctionResponse>(
    'send-organization-invitation',
    {
      body: {
        organizationId: request.organizationId,
        organizationName: request.organizationName.trim(),
        adminName: request.adminName?.trim() || null,
        adminEmail: email,
        redirectTo: request.redirectTo || `${window.location.origin}/accept-invitation`,
      },
    },
  );

  if (error) {
    throw new Error(error.message || 'Kunne ikke sende invitasjonen.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.invitationId || !data.expiresAt) {
    throw new Error('Invitasjonstjenesten returnerte et ugyldig svar.');
  }

  return {
    invitationId: data.invitationId,
    email: data.email || email,
    expiresAt: data.expiresAt,
    status: 'sent',
  };
}
