import { useState, type FormEvent } from 'react';
import { X, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const {
    news, staff, sohbet, settings, inspiration, admins, currentAdmin,
    addNews, updateNews, deleteNews,
    updateSettings, updateInspiration, updateAdminPassword
  } = useApp();

  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
        <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
        <button onClick={onClose} className="text-[#FAF6F0]"><X size={24} /></button>
      </header>

      <div className="flex border-b-2 border-[#C5A880]/20 bg-white shrink-0 overflow-x-auto">
        {(['news', 'sohbet', 'staff', 'settings', 'admins'] as AdminTab[]).map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider ${tab === t ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-[#2D2A26]/40'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'news' && (
          <NewsManager 
            news={news || []} 
            onAdd={addNews} 
            onUpdate={updateNews} 
            onDelete={deleteNews} 
          />
        )}
        
        {tab === 'settings' && (
          <SettingsManager 
            settings={settings} 
            onUpdate={updateSettings} 
            inspiration={inspiration} 
            onUpdateInspiration={updateInspiration} 
            currentAdmin={currentAdmin} 
            onUpdatePassword={updateAdminPassword} 
          />
        )}
      </div>
    </div>
  );
}

// Haber Yönetimi Bölümü
function NewsManager({ news, onUpdate, onDelete }: any) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl mb-4 text-[#2D2A26]">Haberler & Duyurular</h2>
      {news && news.length > 0 ? (
        news.map((item: any) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#C5A880]/10">
            <h3 className="font-medium text-[#2D2A26]">{item.title}</h3>
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-[#2D2A26]/40 border-2 border-dashed border-[#C5A880]/20 rounded-xl">
          Henüz haber eklenmemiş.
        </div>
      )}
    </div>
  );
}

// Ayarlar Bölümü
function SettingsManager({ settings, onUpdate, inspiration, onUpdateInspiration }: any) {
  const [form, setForm] = useState(settings || { vippsNumber: '' });
  const [inspForm, setInspForm] = useState(inspiration || { verse: '', hadith: '' });

  const handleMainSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    onUpdateInspiration(inspForm);
    alert("Ayarlar başarıyla kaydedildi!");
  };

  return (
    <form onSubmit={handleMainSubmit} className="space-y-6">
      <h2 className="font-serif text-xl text-[#2D2A26]">Genel Ayarlar</h2>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#2D2A26]/60 uppercase">Vipps Numarası</label>
        <input 
          className="w-full p-3 rounded-xl border border-[#C5A880]/20 bg-white" 
          placeholder="29816" 
          value={form.vippsNumber || ''} 
          onChange={e => setForm({...form, vippsNumber: e.target.value})} 
        />
      </div>
      <button type="submit" className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium shadow-md">
        Değişiklikleri Kaydet
      </button>
    </form>
  );
}
