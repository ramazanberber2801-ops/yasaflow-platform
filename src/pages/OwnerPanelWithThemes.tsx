import { useMemo, useState } from 'react';
import { CheckCircle2, Palette, RotateCcw, Search, Star } from 'lucide-react';
import { OwnerPanel as BaseOwnerPanel } from './OwnerPanelPersisted';
import { supabase } from '../lib/supabase';
import { themes, type ThemeCategory } from '../lib/themeEngine';

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const categories: Array<{ id: ThemeCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'mosque', label: '🕌 Moské' },
  { id: 'community', label: '🏢 Forening' },
  { id: 'sports', label: '⚽ Idrett' },
  { id: 'charity', label: '❤️ Stiftelse' },
];

const recommendedIds = ['classic-mosque', 'modern-mosque', 'nordic-mosque', 'dark-emerald'];

function contrastText(hex: string) {
  const value = hex.replace('#', '');
  const n = parseInt(value, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? '#2D2A26' : '#FFFFFF';
}

function setThemeVars(theme: (typeof themes)[number]) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', theme.tokens.primary);
  root.style.setProperty('--brand-secondary', theme.tokens.secondary);
  root.style.setProperty('--brand-background', theme.tokens.background);
  root.style.setProperty('--brand-text', theme.tokens.text);
  root.style.setProperty('--brand-primary-text', contrastText(theme.tokens.primary));
  root.style.setProperty('--brand-secondary-text', contrastText(theme.tokens.secondary));
}

function restoreThemeVars(snapshot: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(snapshot).forEach(([key, value]) => root.style.setProperty(key, value));
}

function readThemeVars() {
  const styles = getComputedStyle(document.documentElement);
  return {
    '--brand-primary': styles.getPropertyValue('--brand-primary').trim(),
    '--brand-secondary': styles.getPropertyValue('--brand-secondary').trim(),
    '--brand-background': styles.getPropertyValue('--brand-background').trim(),
    '--brand-text': styles.getPropertyValue('--brand-text').trim(),
    '--brand-primary-text': styles.getPropertyValue('--brand-primary-text').trim(),
    '--brand-secondary-text': styles.getPropertyValue('--brand-secondary-text').trim(),
  };
}

export function OwnerPanel() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ThemeCategory | 'all'>('all');
  const [activeThemeId, setActiveThemeId] = useState('classic-mosque');
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<Record<string, string> | null>(null);
  const [themeStatus, setThemeStatus] = useState('Tema kan forhåndsvises.');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'classic-mosque': true,
    'modern-mosque': true,
  });

  const recommended = themes.filter((theme) => recommendedIds.includes(theme.id));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themes.filter((theme) => {
      const matchesCategory = category === 'all' || theme.category === category;
      const matchesQuery = !q || [theme.name, theme.category, theme.description].join(' ').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  function previewTheme(theme: (typeof themes)[number]) {
    if (!previewSnapshot) setPreviewSnapshot(readThemeVars());
    setThemeVars(theme);
    setPreviewThemeId(theme.id);
    setThemeStatus(`Preview: ${theme.name}`);
  }

  function cancelPreview() {
    if (previewSnapshot) restoreThemeVars(previewSnapshot);
    setPreviewThemeId(null);
    setPreviewSnapshot(null);
    setThemeStatus('Preview avbrutt.');
  }

  async function applyTheme(theme: (typeof themes)[number]) {
    setThemeVars(theme);
    setActiveThemeId(theme.id);
    setPreviewThemeId(null);
    setPreviewSnapshot(null);

    if (!supabase) {
      setThemeStatus('Tema brukt lokalt. Supabase er ikke koblet.');
      return;
    }

    const { error } = await supabase
      .from('organizations')
      .update({ theme_id: theme.id })
      .eq('id', 'dtim');

    if (error) {
      setThemeStatus('Tema brukt lokalt, men ble ikke lagret. Kjør theme_id SQL først.');
      return;
    }

    setThemeStatus(`${theme.name} er lagret for DTIM.`);
  }

  return (
    <div className="space-y-5">
      <BaseOwnerPanel />

      <section className="mx-4 mb-6 rounded-2xl border-2 bg-white p-4" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
            <Palette size={18} />
          </div>
          <div>
            <h3 className="font-serif text-lg">Theme Library</h3>
            <p className="text-xs opacity-50">Prøv tema uten å lagre, eller bruk tema for organisasjonen.</p>
          </div>
        </div>

        <p className="text-xs opacity-60 mb-3">{themeStatus}</p>

        {previewThemeId && (
          <div className="mb-4 rounded-2xl border p-3 flex items-center justify-between gap-3" style={{ borderColor: mix(brand.primary, 20), backgroundColor: mix(brand.primary, 7, '#FFFFFF') }}>
            <div>
              <p className="text-sm font-medium">Preview aktiv</p>
              <p className="text-xs opacity-55">Du ser nå {themes.find((theme) => theme.id === previewThemeId)?.name}. Ingenting er lagret.</p>
            </div>
            <button
              type="button"
              onClick={cancelPreview}
              className="shrink-0 rounded-xl px-3 py-2 text-xs flex items-center gap-1"
              style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}
            >
              <RotateCcw size={13} /> Avbryt
            </button>
          </div>
        )}

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border py-3 pl-10 pr-3 text-sm"
            style={{ borderColor: mix(brand.primary, 18), color: brand.text }}
            placeholder="Søk tema..."
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className="shrink-0 rounded-full border px-3 py-2 text-xs"
              style={{
                borderColor: category === cat.id ? brand.primary : mix(brand.primary, 18),
                backgroundColor: category === cat.id ? mix(brand.primary, 12, '#FFFFFF') : '#FFFFFF',
                color: category === cat.id ? brand.primary : brand.text,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Star size={15} style={{ color: brand.primary }} />
            <h4 className="font-serif text-base">Anbefalte temaer</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recommended.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                favorite={!!favorites[theme.id]}
                isActive={activeThemeId === theme.id}
                isPreviewing={previewThemeId === theme.id}
                onApply={() => applyTheme(theme)}
                onPreview={() => previewTheme(theme)}
                onFavorite={() => setFavorites((prev) => ({ ...prev, [theme.id]: !prev[theme.id] }))}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h4 className="font-serif text-base">Alle temaer</h4>
          <span className="text-xs opacity-50">{filtered.length} temaer</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filtered.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              favorite={!!favorites[theme.id]}
              isActive={activeThemeId === theme.id}
              isPreviewing={previewThemeId === theme.id}
              onApply={() => applyTheme(theme)}
              onPreview={() => previewTheme(theme)}
              onFavorite={() => setFavorites((prev) => ({ ...prev, [theme.id]: !prev[theme.id] }))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard({ theme, favorite, isActive, isPreviewing, onFavorite, onPreview, onApply }: { theme: (typeof themes)[number]; favorite: boolean; isActive: boolean; isPreviewing: boolean; onFavorite: () => void; onPreview: () => void; onApply: () => void }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: isPreviewing || isActive ? theme.tokens.primary : mix(brand.primary, 14) }}>
      <div
        className="rounded-xl p-3 mb-3 border"
        style={{ backgroundColor: theme.tokens.background, color: theme.tokens.text, borderColor: theme.tokens.primary }}
      >
        <div className="h-8 rounded-lg mb-3" style={{ backgroundColor: theme.tokens.secondary }} />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 rounded-lg" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${theme.tokens.primary}` }} />
          <div className="h-14 rounded-lg" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${theme.tokens.primary}` }} />
          <div className="h-14 rounded-lg" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${theme.tokens.primary}` }} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-base">{theme.name}</p>
          <p className="text-xs opacity-50 capitalize">{theme.category}</p>
          <p className="text-xs opacity-60 mt-2">{theme.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onFavorite}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
            style={{ borderColor: mix(brand.primary, 18), color: favorite ? brand.primary : mix(brand.text, 35) }}
            aria-label="Favoritt"
          >
            <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          {isActive && (
            <span className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
              <CheckCircle2 size={12} /> Aktiv
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.primary, borderColor: mix(brand.primary, 16) }} />
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.secondary, borderColor: mix(brand.primary, 16) }} />
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.background, borderColor: mix(brand.primary, 16) }} />
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.card, borderColor: mix(brand.primary, 16) }} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={onPreview}
          className="rounded-xl py-2.5 text-xs font-medium"
          style={{ backgroundColor: isPreviewing ? theme.tokens.primary : mix(brand.primary, 10, '#FFFFFF'), color: isPreviewing ? contrastText(theme.tokens.primary) : brand.primary }}
        >
          {isPreviewing ? 'Preview aktiv' : 'Prøv tema'}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded-xl py-2.5 text-xs font-medium"
          style={{ backgroundColor: theme.tokens.primary, color: contrastText(theme.tokens.primary) }}
        >
          Bruk tema
        </button>
      </div>
    </div>
  );
}
