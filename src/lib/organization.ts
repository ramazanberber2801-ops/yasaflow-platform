export const DEFAULT_ORGANIZATION_ID =
  import.meta.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

export const SELECTED_ORGANIZATION_KEY = 'yasaflow_selected_organization_id';
export const ADMIN_SESSION_KEY = 'yasaflow_admin';
export const LEGACY_ADMIN_SESSION_KEY = 'dtim_admin';

export function readStoredAdminSession<T = Record<string, unknown>>(): T | null {
  try {
    const current = localStorage.getItem(ADMIN_SESSION_KEY);
    if (current) return JSON.parse(current) as T;

    const legacy = localStorage.getItem(LEGACY_ADMIN_SESSION_KEY);
    if (!legacy) return null;

    const parsed = JSON.parse(legacy) as T;
    localStorage.setItem(ADMIN_SESSION_KEY, legacy);
    localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredAdminSession(admin: unknown) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
  localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
}

export function clearStoredAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
}

export function readSelectedOrganizationId() {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('org');
    if (fromQuery) {
      localStorage.setItem(SELECTED_ORGANIZATION_KEY, fromQuery);
      return fromQuery;
    }
    return localStorage.getItem(SELECTED_ORGANIZATION_KEY) || '';
  } catch {
    return '';
  }
}

export function selectOrganization(organizationId: string) {
  localStorage.setItem(SELECTED_ORGANIZATION_KEY, organizationId);
  window.dispatchEvent(new CustomEvent('yasaflow-organization-changed', { detail: { organizationId } }));
}

export function getCurrentOrganizationId() {
  const selected = readSelectedOrganizationId();
  if (selected) return selected;
  const admin = readStoredAdminSession<{ organization_id?: string }>();
  return admin?.organization_id || DEFAULT_ORGANIZATION_ID;
}
