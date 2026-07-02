import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patches) {
  let content = readFileSync(path, 'utf8');
  const original = content;

  for (const patch of patches) {
    const { find, replace, label } = patch;
    if (content.includes(replace)) continue;
    if (!content.includes(find)) {
      throw new Error(`Kurban patch failed in ${path}: ${label}`);
    }
    content = content.replace(find, replace);
  }

  if (content !== original) writeFileSync(path, content);
}

patchFile('src/context/AppContext.tsx', [
  {
    label: 'read Kurban settings from database',
    find: `    ramadanEnabled: row.ramadan_enabled || false,\n    ramadanStartDate: row.ramadan_start_date || '',\n    ramadanEndDate: row.ramadan_end_date || '',`,
    replace: `    ramadanEnabled: row.ramadan_enabled || false,\n    ramadanStartDate: row.ramadan_start_date || '',\n    ramadanEndDate: row.ramadan_end_date || '',\n    kurbanEnabled: row.kurban_enabled || false,\n    kurbanStartDate: row.kurban_start_date || '',`,
  },
  {
    label: 'write Kurban settings to database',
    find: `    ramadan_enabled: !!s.ramadanEnabled,\n    ramadan_start_date: s.ramadanStartDate || null,\n    ramadan_end_date: s.ramadanEndDate || null,`,
    replace: `    ramadan_enabled: !!s.ramadanEnabled,\n    ramadan_start_date: s.ramadanStartDate || null,\n    ramadan_end_date: s.ramadanEndDate || null,\n    kurban_enabled: !!s.kurbanEnabled,\n    kurban_start_date: s.kurbanStartDate || null,`,
  },
]);

patchFile('src/pages/AdminPanel.tsx', [
  {
    label: 'add Kurban settings to superadmin Ramazan module area',
    find: `            <p className="text-xs text-[#2D2A26]/60 mt-3">\n              Son Ramazan Günü\n            </p>\n            <input\n              type="date"\n              className={inputClass}\n              value={form.ramadanEndDate || ''}\n              onChange={(e) => change('ramadanEndDate', e.target.value)}\n            />\n          </div>`,
    replace: `            <p className="text-xs text-[#2D2A26]/60 mt-3">\n              Son Ramazan Günü\n            </p>\n            <input\n              type="date"\n              className={inputClass}\n              value={form.ramadanEndDate || ''}\n              onChange={(e) => change('ramadanEndDate', e.target.value)}\n            />\n\n            <div className="mt-5 pt-5 border-t border-[#C5A880]/20 space-y-3">\n              <h3 className="font-serif text-lg">🐑 Kurban Bayramı Modülü</h3>\n\n              <label className="flex items-center gap-2 text-sm font-medium mt-4">\n                <input\n                  type="checkbox"\n                  checked={form.kurbanEnabled || false}\n                  onChange={(e) => change('kurbanEnabled', e.target.checked)}\n                />\n                🐑 Kurban Bayramı Aktif\n              </label>\n\n              <p className="text-xs text-[#2D2A26]/60 mt-3">\n                İlk Kurban Bayramı Günü\n              </p>\n              <input\n                type="date"\n                className={inputClass}\n                value={form.kurbanStartDate || ''}\n                onChange={(e) => change('kurbanStartDate', e.target.value)}\n              />\n            </div>\n          </div>`,
  },
]);

patchFile('src/pages/HomePage.tsx', [
  {
    label: 'calculate Kurban Bayramı day',
    find: `  const showBayramCard =\n    settings?.ramadanEnabled &&\n    bayramDate &&\n    todayDate.getTime() === bayramDate.getTime();`,
    replace: `  const showBayramCard =\n    settings?.ramadanEnabled &&\n    bayramDate &&\n    todayDate.getTime() === bayramDate.getTime();\n\n  const kurbanStart = settings?.kurbanStartDate\n    ? parseLocalDate(settings.kurbanStartDate)\n    : null;\n\n  const kurbanDay =\n    settings?.kurbanEnabled && kurbanStart\n      ? Math.floor((todayDate.getTime() - kurbanStart.getTime()) / (1000 * 60 * 60 * 24)) + 1\n      : null;\n\n  const showKurbanBayramCard =\n    settings?.kurbanEnabled &&\n    kurbanStart &&\n    kurbanDay !== null &&\n    kurbanDay >= 1 &&\n    kurbanDay <= 4;`,
  },
  {
    label: 'render Kurban Bayramı card',
    find: `      {dailyData && (`,
    replace: `      {showKurbanBayramCard && (\n        <section className="px-4 mt-4">\n          <div className="bg-[#2D2A26] rounded-xl p-6 text-center text-[#FAF6F0] border-2 border-[#C5A880]/30">\n            <div className="flex items-center justify-center gap-2 mb-3">\n              <span className="text-xl" aria-hidden="true">🐑</span>\n              <h2 className="font-serif text-xl text-[#C5A880]">KURBAN BAYRAMI</h2>\n            </div>\n\n            <p className="text-sm text-[#C5A880] font-medium mt-1 mb-3">\n              Kurban Bayramı'nın {kurbanDay}. Günü\n            </p>\n\n            <p className="font-serif text-3xl font-bold text-[#C5A880] leading-tight mb-3">\n              Kurban Bayramınız\n              <br />\n              Mübarek Olsun\n            </p>\n\n            <p className="text-sm text-[#FAF6F0]/70 leading-relaxed">\n              Allah kurbanlarınızı kabul eylesin.\n              <br />\n              Sağlık, huzur ve bereket dolu bayramlar dileriz.\n            </p>\n          </div>\n        </section>\n      )}\n\n      {dailyData && (`,
  },
]);

console.log('Kurban Bayramı module patch applied.');
