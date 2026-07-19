import { supabase } from './supabase';

export type OrganizationRole = 'owner' | 'admin' | 'staff';

export type OrganizationPermissions = {
  role: OrganizationRole | null;
  canViewMembers: boolean;
  canManageMembers: boolean;
  canManageInvitations: boolean;
  canManageOrganization: boolean;
  canPublishContent: boolean;
};

const noAccess: OrganizationPermissions = {
  role: null,
  canViewMembers: false,
  canManageMembers: false,
  canManageInvitations: false,
  canManageOrganization: false,
  canPublishContent: false,
};

export async function getOrganizationPermissions(organizationId: string): Promise<OrganizationPermissions> {
  if (!supabase || !organizationId) return noAccess;

  const { data, error } = await supabase.rpc('yasaflow_organization_role', {
    target_organization_id: organizationId,
  });

  if (error) {
    console.error('Could not resolve organization role', error);
    return noAccess;
  }

  const role = data === 'owner' || data === 'admin' || data === 'staff' ? data : null;
  return {
    role,
    canViewMembers: Boolean(role),
    canManageMembers: role === 'owner',
    canManageInvitations: role === 'owner' || role === 'admin',
    canManageOrganization: role === 'owner',
    canPublishContent: role === 'owner' || role === 'admin' || role === 'staff',
  };
}
