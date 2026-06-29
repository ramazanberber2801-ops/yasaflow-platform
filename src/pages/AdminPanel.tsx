import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { news, staff, sohbet, settings } = useApp();
  const [tab, setTab] = useState<'news' | 'sohbet' | 'staff' | 'settings'>('news');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex justify-between text-white">
        <h1 className="font-serif">Yönetim Paneli</h1>
        <button onClick={onClose}><X /></button>
      </header>

      <div className="flex border-b bg-white">
        {['news', 'sohbet', 'staff', 'settings'].map((t) => (
          <button key={t} onClick={() => setTab(t as any)} className={`flex-1 py-3 text-xs ${tab === t ? 'border-b-2 border-[#C5A880]' : ''}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'news' && news.map((i: any) => (
          <div key={i.id} className="bg-white p-4 rounded-lg border flex gap-4">
            {i.image && <img src={i.image} className="w-16 h-16 object-cover rounded" />}
            <div><h3 className="font-bold">{i.title}</h3><p className="text-xs">{i.content}</p></div>
          </div>
        ))}
        {tab === 'sohbet' && sohbet.map((i: any) => (
          <div key={i.id} className="bg-white p-4 rounded-lg border">{i.title}</div>
        ))}
        {tab === 'staff' && staff.map((i: any) => (
          <div key={i.id} className="bg-white p-4 rounded-lg border">{i.name}</div>
        ))}
        {tab === 'settings' && (
          <div className="bg-white p-4 rounded-lg border">
            <p>Vipps Numarası: {settings.vippsNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
}
