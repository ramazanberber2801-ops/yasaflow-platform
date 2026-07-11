export type ThemeId =
  | 'yasaflow-standard'
  | 'classic-mosque'
  | 'modern-mosque'
  | 'nordic-mosque'
  | 'dark-emerald'
  | 'heritage-mosque'
  | 'community-modern'
  | 'community-minimal'
  | 'sports-dynamic'
  | 'charity-clean'
  | string;

export type ThemeCategory = 'mosque' | 'community' | 'sports' | 'charity' | 'custom';

export type ThemeTokens = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  card: string;
  borderRadius: 'soft' | 'rounded' | 'pill';
  density: 'compact' | 'comfortable' | 'spacious';
};

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  category: ThemeCategory;
  description: string;
  tokens: ThemeTokens;
};

export const DEFAULT_THEME_ID: ThemeId = 'yasaflow-standard';

export const themes: ThemeDefinition[] = [
  {
    id: 'yasaflow-standard',
    name: 'Yasaflow Standard',
    category: 'custom',
    description: 'Yasaflows eget uttrykk inspirert av logoen: dyp marineblå, klar blå og frisk turkis på lyse, moderne flater.',
    tokens: {
      primary: '#0A8DFF',
      secondary: '#071B53',
      background: '#F4FAFF',
      text: '#071B53',
      card: '#FFFFFF',
      borderRadius: 'soft',
      density: 'comfortable',
    },
  },
  {
    id: 'classic-mosque',
    name: 'Classic Mosque',
    category: 'mosque',
    description: 'Tradisjonelt moskéuttrykk med varme toner og tydelig kontrast.',
    tokens: {
      primary: '#8A6A24',
      secondary: '#2D2A26',
      background: '#FAF6F0',
      text: '#2D2A26',
      card: '#FFFFFF',
      borderRadius: 'rounded',
      density: 'comfortable',
    },
  },
  {
    id: 'modern-mosque',
    name: 'Modern Mosque',
    category: 'mosque',
    description: 'Lys, moderne og ren stil for moskeer og islamske organisasjoner.',
    tokens: {
      primary: '#0F766E',
      secondary: '#0F172A',
      background: '#F8FAFC',
      text: '#111827',
      card: '#FFFFFF',
      borderRadius: 'soft',
      density: 'comfortable',
    },
  },
  {
    id: 'nordic-mosque',
    name: 'Nordic Mosque',
    category: 'mosque',
    description: 'Skandinavisk uttrykk med mye luft og rolige farger.',
    tokens: {
      primary: '#334155',
      secondary: '#1E293B',
      background: '#F1F5F9',
      text: '#0F172A',
      card: '#FFFFFF',
      borderRadius: 'soft',
      density: 'spacious',
    },
  },
  {
    id: 'dark-emerald',
    name: 'Emerald Premium',
    category: 'mosque',
    description: 'Premium grønt tema med mørke header-detaljer og lesbar lys flate.',
    tokens: {
      primary: '#047857',
      secondary: '#022C22',
      background: '#ECFDF5',
      text: '#10231D',
      card: '#FFFFFF',
      borderRadius: 'rounded',
      density: 'comfortable',
    },
  },
  {
    id: 'heritage-mosque',
    name: 'Heritage Mosque',
    category: 'mosque',
    description: 'Klassisk og varm stil inspirert av tradisjonelle mønstre.',
    tokens: {
      primary: '#92400E',
      secondary: '#422006',
      background: '#FFF7ED',
      text: '#292524',
      card: '#FFFFFF',
      borderRadius: 'rounded',
      density: 'comfortable',
    },
  },
  {
    id: 'community-modern',
    name: 'Community Modern',
    category: 'community',
    description: 'Nøytral og profesjonell stil for foreninger.',
    tokens: {
      primary: '#1D4ED8',
      secondary: '#1E293B',
      background: '#F8FAFC',
      text: '#111827',
      card: '#FFFFFF',
      borderRadius: 'soft',
      density: 'comfortable',
    },
  },
  {
    id: 'community-minimal',
    name: 'Community Minimal',
    category: 'community',
    description: 'Enkel og lett stil med minimalt visuelt støy.',
    tokens: {
      primary: '#3F3F46',
      secondary: '#18181B',
      background: '#FAFAFA',
      text: '#18181B',
      card: '#FFFFFF',
      borderRadius: 'soft',
      density: 'spacious',
    },
  },
  {
    id: 'sports-dynamic',
    name: 'Sports Dynamic',
    category: 'sports',
    description: 'Aktiv og tydelig stil for idrettslag.',
    tokens: {
      primary: '#B91C1C',
      secondary: '#111827',
      background: '#F9FAFB',
      text: '#111827',
      card: '#FFFFFF',
      borderRadius: 'rounded',
      density: 'compact',
    },
  },
  {
    id: 'charity-clean',
    name: 'Charity Clean',
    category: 'charity',
    description: 'Mykt og tillitsvekkende tema for stiftelser og veldedighet.',
    tokens: {
      primary: '#15803D',
      secondary: '#14532D',
      background: '#F0FDF4',
      text: '#1F2937',
      card: '#FFFFFF',
      borderRadius: 'rounded',
      density: 'comfortable',
    },
  },
];

export function getTheme(themeId: ThemeId = DEFAULT_THEME_ID) {
  return themes.find((theme) => theme.id === themeId) || themes.find((theme) => theme.id === DEFAULT_THEME_ID) || themes[0];
}

export function getThemesByCategory(category: ThemeCategory) {
  return themes.filter((theme) => theme.category === category);
}

export function themeToCssVars(theme: ThemeDefinition) {
  return {
    '--brand-primary': theme.tokens.primary,
    '--brand-secondary': theme.tokens.secondary,
    '--brand-background': theme.tokens.background,
    '--brand-text': theme.tokens.text,
  } as React.CSSProperties;
}
