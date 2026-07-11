import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Palette, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { themes } from '../lib/themeEngine';

type OrganizationOption = {
  id: string;
  name: string;
  themeId: string;
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const availableThemes = themes;

function applyThemePreview(theme: (typeof availableThemes)[number]) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', theme.tokens.primary);
  root.style.setProperty('--brand-secondary', theme.tokens.secondary);
  root.style.setProperty('--brand-background', theme.tokens.background);
  root.style.setProperty('--brand-text', theme.tokens.text);
  root.style.setProperty('--brand-card', theme.tokens.card);

  const contrast = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? '#1F2937' : '#FFFFFF';
  };

  root.style.setProperty('--brand-primary-text', contrast(theme.tokens.primary));
  root.style.setProperty('--brand-secondary-text', contrast(theme.tokens.secondary));
}

export function OwnerThemeManager() {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [themeId, setThemeId] = useState('yasaflow-standard');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setError('Supabase er ikke konfigurert.');
      setLoading(false);
      return;
    }

    supabase
      .from('organizations')
      .select('id, name, theme_id')
      .order('name')
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setError(loadError.message);
          setLoading(false);
          return;
        }

        const rows = (data || []).map((row) => ({
          id: row.id,
          name: row.name || row.id,
          themeId: row.theme_id || 'yasaflow-standard',
        }));

        setOrganizations(rows);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!organizations.length) return;

    const syncWithTopOrganization = () => {
      const visibleText = Array.from(document.querySelectorAll('button'))
        .map((button) => button.textContent?.replace(/\s+/g, ' ').trim() || '')
        .filter(Boolean);

      const match = [...organizations]
        .sort((a, b) => b.name.length - a.name.length)
        .find((organization) => visibleText.some((text) => text === organization.name || text.startsWith(`${organization.name} `)));

      const selected = match || organizations[0];
      if (selected.id !== organizationId) {
        setOrganizationId(selected.id);
        setThemeId(selected.themeId || 'yasaflow-standard');
        setMessage('');
        setError('');
      }
    };

    syncWithTopOrganization();
    const observer = new MutationObserver(syncWithTopOrganization);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [organizations, organizationId]);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId) || null,
    [organizations, organizationId],
  );

  const selectedTheme = useMemo(
    () => availableThemes.find((theme) => theme.id === themeId) || availableThemes[0],
    [themeId],
  );

  const chooseTheme = (id: string) => {
    setThemeId(id);
    setMessage('');
    setError('');
    const theme = availableThemes.find((item) => item.id === id);
    if (theme) applyThemePreview(theme);
  };

  const saveTheme = async () => {
    if (!supabase || !organizationId) return;
    setSaving(true);
    setMessage('');
    setError('');

    const { error: saveError } = await supabase
      .from('organizations')
      .update({ theme_id: themeId, updated_at: new Date().toISOString() })
      .eq('id', organizationId);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setOrganizations((current) =>
      current.map((organization) =>
        organization.id === organizationId ? { ...organization, themeId } : organization,
      ),
    );

    applyThemePreview(selectedTheme);
    localStorage.setItem(`yasaflow_theme_${organizationId}`, themeId);
    setMessage(`Temaet er lagret for ${selectedOrganization?.name || 'organisasjonen'}.`);
    setSaving(false);
  };

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-2xl border-2 bg-white shadow-sm" style={{ borderColor: mix('var(--brand-primary)', 22), color: 'var(--brand-text)' }}>
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: mix('var(--brand-primary)', 12), color: 'var(--brand-primary)' }}>
            <Palette size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Tema og design</p>
            <p className="truncate text-[11px] opacity-50">{selectedOrganization?.name || 'Valgt organisasjon'} · {selectedTheme.name}</p>
          </div>
        </div>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t p-4" style={{ borderColor: mix('var(--brand-primary)', 16) }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm opacity-60"><Loader2 size={17} className="animate-spin" /> Henter temaer...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border px-3 py-2" style={{ borderColor: mix('var(--brand-primary)', 16), backgroundColor: mix('var(--brand-primary)', 5, '#FFFFFF') }}>
                <p className="text-[10px] uppercase tracking-wide opacity-45">Tema endres for</p>
                <p className="text-sm font-semibold">{selectedOrganization?.name || 'Ingen organisasjon valgt'}</p>
                <p className="mt-0.5 text-[11px] opacity-50">Følger organisasjonen som er valgt øverst i Owner Panel.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {availableThemes.map((theme) => {
                  const active = themeId === theme.id;
                  return (
                    <button key={theme.id} type="button" onClick={() => chooseTheme(theme.id)} className="rounded-2xl border-2 p-3 text-left transition" style={{ borderColor: active ? theme.tokens.primary : mix('var(--brand-primary)', 16), backgroundColor: active ? mix(theme.tokens.primary, 7, '#FFFFFF') : '#FFFFFF' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          {[theme.tokens.primary, theme.tokens.secondary, theme.tokens.background, theme.tokens.card].map((color) => <span key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} />)}
                        </div>
                        {active && <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.tokens.primary, color: '#FFFFFF' }}><Check size={15} /></span>}
                      </div>
                      <p className="mt-3 text-sm font-semibold">{theme.name}</p>
                      <p className="mt-1 text-[11px] leading-4 opacity-55">{theme.description}</p>
                    </button>
                  );
                })}
              </div>

              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
              {message && <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">{message}</p>}

              <button type="button" disabled={saving || !selectedOrganization} onClick={() => void saveTheme()} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Lagrer tema...' : `Lagre tema for ${selectedOrganization?.name || 'organisasjonen'}`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
