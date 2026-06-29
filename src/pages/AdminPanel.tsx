import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, UserPlus, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon, UserCog, Check, BookOpen, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';
import type { NewsItem, StaffMember, SohbetItem, MosqueSettings, DailyInspiration } from '../types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const {
    news, staff, sohbet, settings, inspiration, admins, currentAdmin, logout,
    addNews, updateNews, deleteNews,
    addStaff, updateStaff, deleteStaff,
    addSohbet, updateSohbet, deleteSohbet,
    updateSettings, updateInspiration, addAdmin, deleteAdmin, updateAdminPassword,
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
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs font-medium ${tab === t ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-[#2D2A26]/40'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'news' && <NewsManager news={news} onAdd={addNews} onUpdate={updateNews} onDelete={deleteNews} />}
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
        {/* Diğer tablar buraya eklenebilir */}
      </div>
    </div>
  );
}

// Ayarlar Yönetimi
function SettingsManager({ settings, onUpdate, inspiration, onUpdateInspiration, currentAdmin, onUpdatePassword }: any) {
  const [form, setForm] = useState(settings);
  const [inspForm, setInspForm] = useState(inspiration);

  const handleMainSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    onUpdateInspiration(inspForm);
    alert("Ayarlar kaydedildi!");
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleMainSubmit} className="space-y-4">
        <h2 className="font-serif text-xl">Genel Ayarlar</h2>
        <input className="w-full p-2 border" placeholder="Vipps Numarası" value={form.vippsNumber || ''} onChange={e => setForm({...form, vippsNumber: e.target.value})} />
        <button type="submit" className="w-full bg-[#C5A880] text-white p-3 rounded">Kaydet</button>
      </form>

      <div className="border-t pt-8">
        <h2 className="font-serif text-xl">Şifre Değiştir</h2>
        {/* Şifre formu buraya eklenecek */}
      </div>
    </div>
  );
}

// Haber Yönetimi
function NewsManager({ news, onAdd, onUpdate, onDelete }: any) {
  return (
    <div>
      <h2 className="font-serif text-xl mb-4">Haberler</h2>
      {news.map((item: any) => (
        <div key={item.id} className="bg-white p-4 mb-2 rounded shadow">{item.title}</div>
      ))}
    </div>
  );
}
