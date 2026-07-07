import { Palette, CheckCircle2 } from 'lucide-react';
import { OwnerPanel as BaseOwnerPanel } from './OwnerPanelPersisted';
import { themes } from '../lib/themeEngine';

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function OwnerPanel() {
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
            <p className="text-xs opacity-50">Første forhåndsvisning av temaer. Lagring per organisasjon kommer etterpå.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {themes.map((theme) => (
            <div key={theme.id} className="rounded-2xl border p-3" style={{ borderColor: mix(brand.primary, 14) }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-base">{theme.name}</p>
                  <p className="text-xs opacity-50 capitalize">{theme.category}</p>
                  <p className="text-xs opacity-60 mt-2">{theme.description}</p>
                </div>
                {theme.id === 'classic-mosque' && (
                  <span className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
                    <CheckCircle2 size={12} /> Aktiv
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.primary, borderColor: mix(brand.primary, 16) }} />
                <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.secondary, borderColor: mix(brand.primary, 16) }} />
                <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.background, borderColor: mix(brand.primary, 16) }} />
                <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.card, borderColor: mix(brand.primary, 16) }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
