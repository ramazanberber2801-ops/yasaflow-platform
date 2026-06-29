import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, UserPlus, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon, UserCog, Check, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';
import type { NewsItem, StaffMember, SohbetItem, MosqueSettings, AdminAccount } from '../types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const {
    news, staff, sohbet, settings, admins, currentAdmin, logout,
    addNews, updateNews, deleteNews,
    addStaff, updateStaff, deleteStaff,
    addSohbet, updateSohbet, deleteSohbet,
    updateSettings, addAdmin, deleteAdmin, updateAdminPassword,
  } = useApp();
  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  const handleLogout = () => { logout(); onClose(); };
  const isSuperadmin = currentAdmin?.role === 'superadmin';

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'news', label: 'Haberler', icon: Newspaper },
    { id: 'sohbet', label: 'Sohbet/Ders', icon: Mic },
    { id: 'staff', label: 'Kadromuz', icon: Users },
    { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
    { id: 'admins', label: 'Yöneticiler', icon: UserCog },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
        <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-[#FAF6F0]/10 flex items-center justify-center">
          <X size={18} className="text-[#FAF6F0]" />
        </button>
      </header>

      <div className="flex border-b-2 border-[#C5A880]/20 bg-white shrink-0 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 p-3 text-xs font-medium ${tab === t.id ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'}`}>
              <Icon size={15} className="mx-auto mb-1" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'news' && <NewsManager news={news} onAdd={addNews} onUpdate={updateNews} onDelete={deleteNews} />}
        {tab === 'sohbet' && <SohbetManager sohbet={sohbet} onAdd={addSohbet} onUpdate={updateSohbet} onDelete={deleteSohbet} />}
        {tab === 'staff' && <StaffManager staff={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} />}
        {tab === 'settings' && <SettingsManager settings={settings} onUpdate={updateSettings} currentAdmin={currentAdmin} onUpdatePassword={updateAdminPassword} />}
        {tab === 'admins' && <AdminsManager admins={admins} onAdd={addAdmin} onDelete={deleteAdmin} isSuperadmin={isSuperadmin} />}
      </div>
    </div>
  );
}

// SettingsManager (Ayet/Hadis alanı TEMİZLENMİŞ hali)
function SettingsManager({ settings, onUpdate, currentAdmin, onUpdatePassword }: any) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields = [
    { key: 'mosqueName', label: 'Cami / Dernek Adı' },
    { key: 'vippsNumber', label: 'Vipps Numarası' },
    { key: 'address', label: 'Adres' }
  ];

  return (
    <div className="p-4 space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-[#C5A880]/20">
        <h2 className="text-lg font-serif mb-4">Genel Ayarlar</h2>
        {fields.map((f: any) => (
          <div key={f.key} className="mb-3">
            <label className="block text-xs text-[#2D2A26]/70">{f.label}</label>
            <input className="w-full p-2 border rounded" value={form[f.key] || ''} onChange={(e) => setForm({...form, [f.key]: e.target.value})} />
          </div>
        ))}
        <button type="submit" className="w-full py-2 bg-[#C5A880] text-white rounded">Kaydet</button>
      </form>
    </div>
  );
}

// --- Not: NewsManager, SohbetManager, StaffManager, AdminsManager kodlarını 
// senin eski dosyanın sonundan buraya ekleyebilirsin. 
// Onları silmediğin sürece kod çalışacaktır. ---
