export type OwnerOrganizationDraft = {
  id: string;
  name: string;
  adminEmail: string;
  domain: string;
  liveUrl: string;
  vercelUrl: string;
  supabaseUrl: string;
};

export type OwnerPanelValidationErrors = Partial<Record<keyof OwnerOrganizationDraft, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORGANIZATION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeOrganizationId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidOptionalUrl(value: string) {
  if (!value) return true;
  if (value.startsWith('/')) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateOwnerOrganization(
  organization: OwnerOrganizationDraft,
): OwnerPanelValidationErrors {
  const errors: OwnerPanelValidationErrors = {};
  const normalizedId = normalizeOrganizationId(organization.id);
  const normalizedEmail = normalizeEmail(organization.adminEmail);

  if (!organization.name.trim()) {
    errors.name = 'Organisasjonsnavn er påkrevd.';
  } else if (organization.name.trim().length < 2) {
    errors.name = 'Organisasjonsnavnet må inneholde minst 2 tegn.';
  }

  if (!normalizedId) {
    errors.id = 'Organisasjons-ID er påkrevd.';
  } else if (!ORGANIZATION_ID_PATTERN.test(normalizedId)) {
    errors.id = 'Organisasjons-ID kan bare inneholde små bokstaver, tall og bindestrek.';
  }

  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    errors.adminEmail = 'Skriv inn en gyldig e-postadresse.';
  }

  const urlFields: Array<keyof Pick<OwnerOrganizationDraft, 'liveUrl' | 'vercelUrl' | 'supabaseUrl'>> = [
    'liveUrl',
    'vercelUrl',
    'supabaseUrl',
  ];

  for (const field of urlFields) {
    const normalized = normalizeOptionalUrl(organization[field]);
    if (!isValidOptionalUrl(normalized)) {
      errors[field] = 'Skriv inn en gyldig URL.';
    }
  }

  const domain = organization.domain.trim();
  if (domain && /\s/.test(domain)) {
    errors.domain = 'Domenet kan ikke inneholde mellomrom.';
  }

  return errors;
}

export function hasOwnerPanelValidationErrors(errors: OwnerPanelValidationErrors) {
  return Object.keys(errors).length > 0;
}
