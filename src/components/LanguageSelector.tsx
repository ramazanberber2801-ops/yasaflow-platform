import { Check, ChevronDown, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { findLanguage, searchLanguages } from '../lib/languageRegistry';

export function LanguageSelector({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (code: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = findLanguage(value);
  const languages = useMemo(() => searchLanguages(query), [query]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white text-left ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}
        style={{ borderColor: 'color-mix(in srgb, var(--brand-primary) 22%, transparent)', color: 'var(--brand-text)' }}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{selected.nativeName}</span>
          <span className="block truncate text-[11px] opacity-50">
            {selected.name} · {selected.code.toUpperCase()}{selected.direction === 'rtl' ? ' · RTL' : ''}
          </span>
        </span>
        <ChevronDown size={17} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-[100] mt-2 rounded-2xl border bg-white p-3 shadow-2xl" style={{ borderColor: 'color-mix(in srgb, var(--brand-primary) 18%, transparent)', color: 'var(--brand-text)' }}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Søk språk..."
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => {
                  onChange(language.code);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-black/5"
              >
                <span>
                  <span className="block text-sm font-semibold">{language.nativeName}</span>
                  <span className="block text-[11px] opacity-50">{language.name} · {language.code.toUpperCase()}{language.direction === 'rtl' ? ' · RTL' : ''}</span>
                </span>
                {selected.code === language.code && <Check size={16} style={{ color: 'var(--brand-primary)' }} />}
              </button>
            ))}
            {languages.length === 0 && <p className="p-4 text-center text-sm opacity-50">Ingen språk funnet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
