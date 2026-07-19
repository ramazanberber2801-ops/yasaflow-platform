import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Palette, RotateCcw, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { applyThemeToDocument, themes } from '../lib/themeEngine';

type OrganizationOption = { id: string; name: string; themeId: string };

const DEFAULT_THEME_ID = 'yasaflow-standard';
const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function OwnerThemeManager() {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadOrganizations = async () => {
    const client = supabase;
    if (!client) {
      setError('Supabase er ikke konfigurert.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    const { data, error: loadError } = await client
      .from('organizations')
      .select('id,name,theme_id,organization_type')
      .neq('id', 'dtim')
      .neq('organization_type', 'system')
      .order('name');

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    const rows = (data || []).map((row) => ({
      id: row.id,
      name: row.name || row.id,
      themeId: row.theme_id || DEFAULT_THEME_ID,
    }));
    setOrganizations(rows);

    const savedOrganizationId = localStorage.getItem('yasaflow_owner_selected_organization');
    const selected = rows.find((row) => row.id === savedOrganizationId) || rows[0];
    if (selected) {
      setOrganizationId(selected.id);
      setThemeId(selected.themeId);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadOrganizations();
  }, []);

  useEffect(() => {
    const handleSelected = (event: Event) => {
      const id = (event as CustomEvent<{ organizationId: string }>).detail?.organizationId;
      if (!id) return;
      const selected = organizations.find((item) => item.id === id);
      if (!selected) return;
      setOrganizationId(id);
      setThemeId(selected.themeId || DEFAULT_THEME_ID);
      setMessage('');
      setError('');
    };
    window.addEventListener('yasaflow-owner-organization-selected', handleSelected);
    return () => window.removeEventListener('yasaflow-owner-organization-selected', handleSelected);
  }, [organizations]);

  const selectedOrganization = useMemo(
    () => organizations.find((item) => item.id === organizationId) || null,
    [organizations, organizationId],
  );
  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === themeId) || themes[0],
    [themeId],
  );
  const savedThemeId = selectedOrganization?.themeId || DEFAULT_THEME_ID;
  const hasChanges = Boolean(selectedOrganization && themeId !== savedThemeId);

  const chooseTheme = (id: string) => {
    if (saving) return;
    const theme = themes.find((item) => item.id === id);
    if (!theme) return;
    setThemeId(id);
    setMessage('');
    setError('');
    applyThemeToDocument(theme);
  };

  const resetPreview = () => {
    const savedTheme = themes.find((theme) => theme.id === savedThemeId) || themes[0];
    setThemeId(savedTheme.id);
    setMessage('Forhåndsvisningen er tilbakestilt.');
    setError('');
    applyThemeToDocument(savedTheme);
  };

  const saveTheme = async () => {
    const client = supabase;
    if (!client || !selectedOrganization || !selectedTheme || saving || !hasChanges) return;

    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { data, error: saveError } = await client
        .from('organizations')
        .update({ theme_id: selectedTheme.id, updated_at: new Date().toISOString() })
        .eq('id', selectedOrganization.id)
        .select('id,theme_id')
        .single();

      if (saveError) throw saveError;
      if (!data || data.theme_id !== selectedTheme.id) {
        throw new Error('Temaet ble ikke bekreftet lagret. Prøv igjen.');
      }

      setOrganizations((current) =>
        current.map((item) =>
          item.id === selectedOrganization.id ? { ...item, themeId: selectedTheme.id } : item,
        ),
      );
      localStorage.setItem(`yasaflow_theme_${selectedOrganization.id}`, selectedTheme.id);
      window.dispatchEvent(
        new CustomEvent('yasaflow-owner-theme-changed', {
          detail: { organizationId: selectedOrganization.id, themeId: selectedTheme.id },
        }),
      );
      applyThemeToDocument(selectedTheme);
      setMessage(`Temaet er lagret for ${selectedOrganization.name}.`);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Temaet kunne ikke lagres.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="mx-4 mt-4 overflow-hidden rounded-2xl border-2 bg-white shadow-sm"
      style={{ borderColor: mix('var(--brand-primary)', 22), color: 'var(--brand-text)' }}
      aria-labelledby="owner-theme-title"
      aria-busy={loading || saving}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
        aria-controls="owner-theme-content"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: mix('var(--brand-primary)', 12), color: 'var(--brand-primary)' }}
          >
            <Palette size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p id="owner-theme-title" className="text-sm font-medium">Tema og design</p>
            <p className="truncate text-[11px] opacity-50">
              {selectedOrganization?.name || 'Valgt organisasjon'} · {selectedTheme.name}
            </p>
          </div>
        </div>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="owner-theme-content" className="border-t p-4" style={{ borderColor: mix('var(--brand-primary)', 16) }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm opacity-60" role="status">
              <Loader2 size={17} className="animate-spin" aria-hidden="true" /> Henter temaer...
            </div>
          ) : organizations.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-center">
              <p className="text-sm font-medium">Ingen organisasjoner funnet</p>
              <p className="mt-1 text-xs opacity-55">Opprett en organisasjon før du velger tema.</p>
              {error && <p className="mt-3 text-xs text-red-700" role="alert">{error}</p>}
              <button type="button" onClick={() => void loadOrganizations()} className="mt-4 rounded-xl border px-4 py-2 text-xs">
                Prøv igjen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="rounded-xl border px-3 py-2"
                style={{ borderColor: mix('var(--brand-primary)', 16), backgroundColor: mix('var(--brand-primary)', 5, '#FFFFFF') }}
              >
                <p className="text-[10px] uppercase tracking-wide opacity-45">Tema endres for</p>
                <p className="text-sm font-semibold">{selectedOrganization?.name || 'Ingen organisasjon valgt'}</p>
                <p className="mt-0.5 text-[11px] opacity-50">Følger organisasjonen som er valgt øverst i Owner Panel.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Velg tema">
                {themes.map((theme) => {
                  const active = themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={saving}
                      onClick={() => chooseTheme(theme.id)}
                      className="rounded-2xl border-2 p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: active ? theme.tokens.primary : mix('var(--brand-primary)', 16),
                        backgroundColor: active ? mix(theme.tokens.primary, 7, '#FFFFFF') : '#FFFFFF',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5" aria-label="Temafarger">
                          {[theme.tokens.primary, theme.tokens.secondary, theme.tokens.background, theme.tokens.card].map((color, index) => (
                            <span key={`${color}-${index}`} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} aria-hidden="true" />
                          ))}
                        </div>
                        {active && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.tokens.primary, color: '#FFFFFF' }}>
                            <Check size={15} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm font-semibold">{theme.name}</p>
                      <p className="mt-1 text-[11px] leading-4 opacity-55">{theme.description}</p>
                    </button>
                  );
                })}
              </div>

              <div aria-live="polite" aria-atomic="true">
                {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
                {message && <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700" role="status">{message}</p>}
              </div>

              <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
                <button
                  type="button"
                  disabled={saving || !hasChanges}
                  onClick={resetPreview}
                  className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={16} aria-hidden="true" /> Tilbakestill
                </button>
                <button
                  type="button"
                  disabled={saving || !selectedOrganization || !hasChanges}
                  onClick={() => void saveTheme()}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                  {saving ? 'Lagrer tema...' : hasChanges ? `Lagre tema for ${selectedOrganization?.name}` : 'Temaet er allerede lagret'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
