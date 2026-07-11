import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Palette, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { themes } from '../lib/themeEngine';

type OrganizationOption = {
  id: string;
  name: string;
  themeId: string;
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function OwnerThemeManager() {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [themeId, setThemeId] = useState('classic-mosque');
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
          themeId: row.theme_id || 'classic-mosque',
        }));

        setOrganizations(rows);
        if (rows.length) {
          setOrganizationId(rows[0].id);
          setThemeId(rows[0].themeId);
        }
        setLoading(false);
      });
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId) || null,
    [organizations, organizationId],
  );

  const selectOrganization = (id: string) => {
    setOrganizationId(id);
    const selected = organizations.find((organization) => organization.id === id);
    setThemeId(selected?.themeId || 'classic-mosque');
    setMessage('');
    setError('');
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
    setMessage('Temaet er lagret. Oppdater appen for å se endringen.');
    setSaving(false);
  };

  return (
    <section className="mx-4 mt-4 rounded-3xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: mix('var(--brand-primary)', 22), color: 'var(--brand-text)' }}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: mix('var(--brand-primary)', 12), color: 'var(--brand-primary)' }}>
          <Palette size={20} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] opacity-45">Design</p>
          <h2 className="font-serif text-xl">Temaer</h2>
          <p className="mt-1 text-xs leading-5 opacity-55">Velg tema for hver organisasjon. Temaet lagres direkte på organisasjonen.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm opacity-60"><Loader2 size={17} className="animate-spin" /> Henter temaer...</div>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium">Organisasjon</label>
            <select className="mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm" value={organizationId} onChange={(event) => selectOrganization(event.target.value)}>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {themes.map((theme) => {
              const active = themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => { setThemeId(theme.id); setMessage(''); setError(''); }}
                  className="rounded-2xl border-2 p-3 text-left transition"
                  style={{ borderColor: active ? theme.tokens.primary : mix('var(--brand-primary)', 16), backgroundColor: active ? mix(theme.tokens.primary, 7, '#FFFFFF') : '#FFFFFF' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {[theme.tokens.primary, theme.tokens.secondary, theme.tokens.background, theme.tokens.card].map((color) => <span key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} />)}
                    </div>
                    {active && <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.tokens.primary, color: '#FFFFFF' }}><Check size={15} /></span>}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{theme.name}</p>
                  <p className="mt-1 text-[11px] leading-4 opacity-55">{theme.description}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wide opacity-40">{theme.category}</p>
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
    </section>
  );
}
