import { useState, useEffect, useRef, type FormEvent, type CSSProperties, type ReactNode } from 'react';
import {
  X, Newspaper, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon,
  UserCog, Check, Eye, EyeOff, Bell, BarChart3, Palette, Crown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { OwnerPanel } from './OwnerPanel';

type AdminTab = 'owner' | 'news' | 'sohbet' | 'staff' | 'settings' | 'branding' | 'admins' | 'push' | 'stats';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const inputBaseClass = 'w-full px-4 py-2.5 rounded-lg bg-white border text-sm focus:outline-none';
const inputStyle: CSSProperties = {
  borderColor: mix(brand.primary, 22),
  color: brand.text,
};
const cardStyle: CSSProperties = {
  backgroundColor: '#FFFFFF',
  color: brand.text,
  borderColor: mix(brand.primary, 25),
};
const primaryButtonStyle: CSSProperties = {
  backgroundColor: brand.primary,
  color: brand.primaryText,
};
const secondaryButtonStyle: CSSProperties = {
  backgroundColor: brand.secondary,
  color: brand.secondaryText,
};

const isSuperAdminRole = (role?: string) => role === 'super_admin' || role === 'superadmin';

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBaseClass} ${props.className || ''}`} style={{ ...inputStyle, ...props.style }} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBaseClass} ${props.className || ''}`} style={{ ...inputStyle, ...props.style }} />;
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBaseClass} ${props.className || ''}`} style={{ ...inputStyle, ...props.style }} />;
}

function PanelCard({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`bg-white rounded-xl border-2 ${className}`} style={{ ...cardStyle, ...style }}>{children}</div>;
}

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    news, staff, sohbet, settings, admins, currentAdmin, logout,
    addNews, updateNews, deleteNews,
    addStaff, updateStaff, deleteStaff,
    addSohbet, updateSohbet, deleteSohbet, sendSohbetReminder,
    updateSettings, deleteAdmin, updateAdminPassword
  } = useApp();

  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  const isSuperadmin = isSuperAdminRole(currentAdmin?.role);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const tabs = [
    ...(isSuperadmin ? [{ id: 'owner' as AdminTab, label: 'Owner', icon: Crown }] : []),
    { id: 'news' as AdminTab, label: 'Haberler', icon: Newspaper },
    { id: 'sohbet' as AdminTab, label: 'Sohbet/Ders', icon: Mic },
    { id: 'staff' as AdminTab, label: 'Yönetim', icon: Users },
    { id: 'settings' as AdminTab, label: 'Ayarlar', icon: SettingsIcon },
    ...(isSuperadmin ? [{ id: 'branding' as AdminTab, label: 'Branding', icon: Palette }] : []),
    { id: 'admins' as AdminTab, label: 'Yöneticiler', icon: UserCog },
    { id: 'push' as AdminTab, label: 'Bildirim', icon: Bell },
    { id: 'stats' as AdminTab, label: 'İstatistik', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ backgroundColor: brand.background, color: brand.text }}>
      <header className="px-5 py-4 flex items-center justify-between shrink-0 shadow-md" style={{ backgroundColor: brand.secondary, color: brand.secondaryText }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 22) }}>
            <ShieldCheck size={18} style={{ color: brand.primary }} />
          </div>
          <div>
            <h1 className="font-serif text-lg">Yönetim Paneli</h1>
            <p className="text-[10px] opacity-55">
              {currentAdmin?.displayName || currentAdmin?.display_name || currentAdmin?.username || 'Admin'} · {isSuperadmin ? 'Süper Admin' : 'Admin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: brand.secondaryText }}>
            <LogOut size={14} /> Çıkış
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
            <X size={18} style={{ color: brand.secondaryText }} />
          </button>
        </div>
      </header>

      <div className="flex border-b-2 bg-white shrink-0 overflow-x-auto" style={{ borderColor: mix(brand.primary, 20) }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 min-w-[78px] flex items-center justify-center gap-1.5 py-3 text-xs font-medium relative"
              style={{ color: active ? brand.primary : mix(brand.text, 45) }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: brand.primary }} />}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto">
        {tab === 'owner' && isSuperadmin && <OwnerPanel />}
        {tab === 'news' && <NewsManager items={news} onAdd={addNews} onUpdate={updateNews} onDelete={deleteNews} />}
        {tab === 'sohbet' && <SohbetManager items={sohbet} onAdd={addSohbet} onUpdate={updateSohbet} onDelete={deleteSohbet} onReminder={sendSohbetReminder} />}
        {tab === 'staff' && <StaffManager items={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} />}
        {tab === 'settings' && <SettingsManager settings={settings} onUpdate={updateSettings} currentAdmin={currentAdmin} onUpdatePassword={updateAdminPassword} />}
        {tab === 'branding' && isSuperadmin && <BrandingManager settings={settings} onUpdate={updateSettings} />}
        {tab === 'admins' && <AdminsManager admins={admins} onDelete={deleteAdmin} isSuperadmin={isSuperadmin} />}
        {tab === 'push' && <PushManager />}
        {tab === 'stats' && <StatsManager />}
      </main>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: mix(brand.text, 65) }}><ArrowLeft size={16} /> Geri</button>;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="w-full mb-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2" style={primaryButtonStyle}><Plus size={18} /> {label}</button>;
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex flex-col gap-1.5"><button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12) }}><Edit3 size={14} style={{ color: brand.primary }} /></button><button onClick={onDelete} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-red-500" /></button></div>;
}

function SaveCancelButtons({ onCancel }: { onCancel: () => void }) {
  return <div className="flex gap-3"><button type="button" onClick={onCancel} className="flex-1 py-3 rounded-lg bg-white border text-sm" style={{ borderColor: mix(brand.primary, 30), color: brand.text }}>İptal</button><button type="submit" className="flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={primaryButtonStyle}><Save size={16} /> Kaydet</button></div>;
}

function EmptyState({ text }: { text: string }) {
  return <PanelCard className="p-8 text-center"><p className="text-sm opacity-50">{text}</p></PanelCard>;
}

function NewsManager({ items, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  if (showForm || editing) return <NewsForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={() => { setEditing(null); setShowForm(false); }} />;
  return <div className="p-4"><AddButton label="Yeni Haber Ekle" onClick={() => setShowForm(true)} />{items.length === 0 ? <EmptyState text="Henüz haber eklenmemiş." /> : <div className="space-y-3">{items.map((item: any) => { const imageSrc = item.imageBase64 || item.image_base64; return <PanelCard key={item.id} className="p-3 flex gap-3">{imageSrc && <img src={imageSrc} className="w-16 h-16 rounded-lg object-cover" />}<div className="flex-1 min-w-0"><span className="text-[10px] uppercase" style={{ color: brand.primary }}>{item.category}</span><h3 className="font-serif text-sm truncate">{item.title}</h3><p className="text-xs opacity-50 truncate">{item.content}</p></div><ActionButtons onEdit={() => setEditing(item)} onDelete={() => { if (confirm('Bu haberi silmek istiyor musunuz?')) onDelete(item.id); }} /></PanelCard>; })}</div>}</div>;
}

function NewsForm({ item, onAdd, onUpdate, onClose }: any) {
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [category, setCategory] = useState(item?.category || 'Duyuru');
  const [imageBase64, setImageBase64] = useState(item?.imageBase64 || item?.image_base64 || '');
  const [sendPush, setSendPush] = useState(item ? false : true);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadImage = async (e: any) => { const file = e.target.files?.[0]; if (!file) return; const base64 = await fileToOptimizedBase64(file); setImageBase64(base64); if (fileRef.current) fileRef.current.value = ''; };
  const submit = async (e: FormEvent) => { e.preventDefault(); if (!title.trim()) return setError('Başlık zorunludur.'); if (!content.trim()) return setError('İçerik zorunludur.'); const data = { id: item?.id || `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: title.trim(), content: content.trim(), category, image_base64: imageBase64, date: item?.date || new Date().toISOString(), _sendPush: sendPush }; if (item) await onUpdate(item.id, data); else await onAdd(data); onClose(); };
  return <div className="p-4"><BackButton onClick={onClose} /><form onSubmit={submit} className="space-y-4"><h2 className="font-serif text-xl">{item ? 'Haberi Düzenle' : 'Yeni Haber'}</h2>{imageBase64 ? <div className="relative"><img src={imageBase64} className="w-full h-40 object-cover rounded-xl" /><button type="button" onClick={() => setImageBase64('')} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2"><Trash2 size={14} /></button></div> : <label className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer" style={{ borderColor: mix(brand.primary, 30) }}><Upload size={20} style={{ color: brand.primary }} /><span className="text-xs opacity-50">Resim seç</span><input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" /></label>}<TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık" /><SelectInput value={category} onChange={e => setCategory(e.target.value)}><option>Duyuru</option><option>Etkinlik</option><option>Eğitim</option><option>Ramazan</option><option>Diğer</option></SelectInput><TextArea className="resize-none" rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="İçerik" /><label className="flex items-center gap-2 text-xs bg-white rounded-lg border p-3" style={{ borderColor: mix(brand.primary, 20), color: mix(brand.text, 70) }}><input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} />Bildirim Gönder</label>{error && <p className="text-sm text-red-600">{error}</p>}<SaveCancelButtons onCancel={onClose} /></form></div>;
}

function SohbetManager({ items, onAdd, onUpdate, onDelete, onReminder }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  if (showForm || editing) return <SohbetForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={() => { setEditing(null); setShowForm(false); }} />;
  return <div className="p-4"><AddButton label="Yeni Sohbet / Ders Ekle" onClick={() => setShowForm(true)} />{items.length === 0 ? <EmptyState text="Henüz sohbet/ders eklenmemiş." /> : <div className="space-y-3">{items.map((item: any) => <PanelCard key={item.id} className="p-3 flex gap-3"><div className="w-14 h-14 rounded-lg flex flex-col items-center justify-center" style={{ backgroundColor: brand.secondary, color: brand.secondaryText }}><span className="text-[9px]" style={{ color: brand.primary }}>{item.date}</span><span className="font-serif text-sm">{item.time}</span></div><div className="flex-1 min-w-0"><h3 className="font-serif text-sm truncate">{item.title}</h3><p className="text-xs opacity-50 truncate">{item.description}</p><p className="text-[10px] opacity-40">{item.speaker}</p></div><div className="flex flex-col gap-1.5"><button onClick={() => { if (confirm('Bu program için hatırlatma gönderilsin mi?')) onReminder(item); }} className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm">🔔</button><button onClick={() => setEditing(item)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12) }}><Edit3 size={14} style={{ color: brand.primary }} /></button><button onClick={() => { if (confirm('Bu programı silmek istiyor musunuz?')) onDelete(item.id); }} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-red-500" /></button></div></PanelCard>)}</div>}</div>;
}

function SohbetForm({ item, onAdd, onUpdate, onClose }: any) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [date, setDate] = useState(item?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(item?.time || '19:00');
  const [location, setLocation] = useState(item?.location || 'Dernek Merkezi - Drammen');
  const [speaker, setSpeaker] = useState(item?.speaker || '');
  const [sendPush, setSendPush] = useState(item ? false : true);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => { e.preventDefault(); if (!title.trim()) return setError('Başlık zorunludur.'); if (!description.trim()) return setError('Açıklama zorunludur.'); if (!speaker.trim()) return setError('Konuşmacı zorunludur.'); const data = { id: item?.id || `sohbet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, description, date, time, location, speaker, _sendPush: sendPush }; if (item) await onUpdate(item.id, data); else await onAdd(data); onClose(); };
  return <div className="p-4"><BackButton onClick={onClose} /><form onSubmit={submit} className="space-y-4"><h2 className="font-serif text-xl">{item ? 'Sohbet/Ders Düzenle' : 'Yeni Sohbet / Ders'}</h2><TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık" /><TextArea className="resize-none" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama" /><div className="grid grid-cols-2 gap-3"><TextInput type="date" value={date} onChange={e => setDate(e.target.value)} /><TextInput type="time" value={time} onChange={e => setTime(e.target.value)} /></div><TextInput value={location} onChange={e => setLocation(e.target.value)} placeholder="Konum" /><TextInput value={speaker} onChange={e => setSpeaker(e.target.value)} placeholder="Konuşmacı" /><label className="flex items-center gap-2 text-xs bg-white rounded-lg border p-3" style={{ borderColor: mix(brand.primary, 20), color: mix(brand.text, 70) }}><input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} />Bildirim Gönder</label>{error && <p className="text-sm text-red-600">{error}</p>}<SaveCancelButtons onCancel={onClose} /></form></div>;
}

function StaffManager({ items, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  if (showForm || editing) return <StaffForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={() => { setEditing(null); setShowForm(false); }} />;
  return <div className="p-4"><AddButton label="Yeni Yönetim Üyesi Ekle" onClick={() => setShowForm(true)} />{items.length === 0 ? <EmptyState text="Henüz yönetim üyesi eklenmemiş." /> : <div className="space-y-3">{items.map((item: any) => <PanelCard key={item.id} className="p-3 flex items-center gap-3"><div className="w-12 h-12 rounded-full flex items-center justify-center font-serif" style={primaryButtonStyle}>{item.name?.charAt(0)}</div><div className="flex-1 min-w-0"><h3 className="font-serif text-sm truncate">{item.name}</h3><p className="text-xs" style={{ color: brand.primary }}>{item.position}</p>{item.phone && <p className="text-xs opacity-50">{item.phone}</p>}</div><ActionButtons onEdit={() => setEditing(item)} onDelete={() => { if (confirm('Bu yönetim üyesini silmek istiyor musunuz?')) onDelete(item.id); }} /></PanelCard>)}</div>}</div>;
}

function StaffForm({ item, onAdd, onUpdate, onClose }: any) {
  const [name, setName] = useState(item?.name || '');
  const [position, setPosition] = useState(item?.position || '');
  const [phone, setPhone] = useState(item?.phone || '');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => { e.preventDefault(); if (!name.trim()) return setError('İsim zorunludur.'); if (!position.trim()) return setError('Görev zorunludur.'); const data = { name, position, phone }; if (item) await onUpdate(item.id, data); else await onAdd(data); onClose(); };
  return <div className="p-4"><BackButton onClick={onClose} /><form onSubmit={submit} className="space-y-4"><h2 className="font-serif text-xl">{item ? 'Yönetim Üyesini Düzenle' : 'Yeni Yönetim Üyesi'}</h2><TextInput value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad" /><TextInput value={position} onChange={e => setPosition(e.target.value)} placeholder="Başkan, Sekreter, Muhasip..." /><TextInput value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon opsiyonel" />{error && <p className="text-sm text-red-600">{error}</p>}<SaveCancelButtons onCancel={onClose} /></form></div>;
}

function hexToRgb(hex: string) { const normalized = hex.replace('#', ''); if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 0, g: 0, b: 0 }; const value = parseInt(normalized, 16); return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }; }
function contrastText(hex: string) { const { r, g, b } = hexToRgb(hex); const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255; return luminance > 0.58 ? '#2D2A26' : '#FFFFFF'; }
function contrastRatio(bg: string, fg: string) { const luminance = (hex: string) => { const { r, g, b } = hexToRgb(hex); const parts = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2]; }; const l1 = luminance(bg); const l2 = luminance(fg); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block space-y-1"><span className="text-xs font-medium opacity-70">{label}</span><div className="flex gap-2"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-12 h-10 rounded-lg border bg-white" style={{ borderColor: mix(brand.primary, 20) }} /><TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="#C5A880" /></div></label>;
}

function BrandingManager({ settings, onUpdate }: any) {
  const defaults = { brandingPrimaryColor: '#C5A880', brandingSecondaryColor: '#2D2A26', brandingBackgroundColor: '#FAF6F0', brandingTextColor: '#2D2A26' };
  const [form, setForm] = useState<any>({ ...defaults, ...(settings || {}) });
  const [saved, setSaved] = useState(false);
  useEffect(() => { setForm({ ...defaults, ...(settings || {}) }); }, [settings]);
  const change = (key: string, value: string) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const primaryText = contrastText(form.brandingPrimaryColor);
  const secondaryText = contrastText(form.brandingSecondaryColor);
  const bgRatio = contrastRatio(form.brandingBackgroundColor, form.brandingTextColor);
  const bgOk = bgRatio >= 4.5;
  const submit = async (e: FormEvent) => { e.preventDefault(); await onUpdate(form); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const resetDefaults = () => setForm((prev: any) => ({ ...prev, ...defaults }));
  return <div className="p-4 space-y-4"><div><h2 className="font-serif text-xl">Branding Studio</h2><p className="text-xs opacity-50 mt-1">Farger kan testes her. Logo og app-ikon kommer i neste fase.</p></div><form onSubmit={submit} className="space-y-4"><PanelCard className="p-4 space-y-3"><h3 className="font-serif text-lg">🎨 Farger</h3><ColorField label="Primærfarge" value={form.brandingPrimaryColor} onChange={(v) => change('brandingPrimaryColor', v)} /><ColorField label="Sekundærfarge" value={form.brandingSecondaryColor} onChange={(v) => change('brandingSecondaryColor', v)} /><ColorField label="Bakgrunnsfarge" value={form.brandingBackgroundColor} onChange={(v) => change('brandingBackgroundColor', v)} /><ColorField label="Tekstfarge" value={form.brandingTextColor} onChange={(v) => change('brandingTextColor', v)} /></PanelCard><PanelCard className="p-4 space-y-3"><h3 className="font-serif text-lg">🤖 Automatisk kontrast</h3><p className="text-xs opacity-60">Primærfarge bruker automatisk <b>{primaryText === '#FFFFFF' ? 'lys tekst' : 'mørk tekst'}</b>.</p><p className="text-xs opacity-60">Sekundærfarge bruker automatisk <b>{secondaryText === '#FFFFFF' ? 'lys tekst' : 'mørk tekst'}</b>.</p><p className={`text-xs ${bgOk ? 'text-green-700' : 'text-red-600'}`}>Bakgrunn + tekst kontrast: {bgRatio.toFixed(1)}:1 {bgOk ? '✓ Godkjent' : '⚠ Kan være vanskelig å lese'}</p></PanelCard><div className="rounded-xl p-4 border-2 space-y-4" style={{ backgroundColor: form.brandingBackgroundColor, color: form.brandingTextColor, borderColor: mix(brand.primary, 25) }}><h3 className="font-serif text-lg">👀 Forhåndsvisning</h3><div className="rounded-xl overflow-hidden border border-black/10 bg-white/80"><div className="p-4" style={{ backgroundColor: form.brandingSecondaryColor, color: secondaryText }}><p className="font-serif text-lg">{form.mosqueName || 'Foreningsnavn'}</p><p className="text-xs opacity-80">Mobilapp forhåndsvisning</p></div><div className="p-4 space-y-3" style={{ backgroundColor: form.brandingBackgroundColor, color: form.brandingTextColor }}><div className="rounded-xl p-3 bg-white shadow-sm"><p className="text-[10px] uppercase" style={{ color: form.brandingPrimaryColor }}>Duyuru</p><p className="font-serif text-base">Nyhetskort</p><p className="text-xs opacity-70">Slik kan tekst og kort se ut i appen.</p></div><button type="button" className="w-full py-3 rounded-xl font-medium" style={{ backgroundColor: form.brandingPrimaryColor, color: primaryText }}>Primær knapp</button><button type="button" className="w-full py-3 rounded-xl font-medium" style={{ backgroundColor: form.brandingSecondaryColor, color: secondaryText }}>Sekundær knapp</button></div></div></div>{saved && <p className="text-sm text-green-700 flex items-center gap-2"><Check size={16} /> Branding kaydedildi.</p>}<div className="flex gap-3"><button type="button" onClick={resetDefaults} className="flex-1 py-3 rounded-lg bg-white border text-sm" style={{ borderColor: mix(brand.primary, 30), color: brand.text }}>Standarda dön</button><button type="submit" className="flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={primaryButtonStyle}><Save size={16} /> Kaydet</button></div></form></div>;
}

function SettingsManager({ settings, onUpdate, currentAdmin, onUpdatePassword }: any) {
  const [form, setForm] = useState<any>(settings || {});
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const isSuperadmin = isSuperAdminRole(currentAdmin?.role);
  useEffect(() => { setForm(settings || {}); }, [settings]);
  const change = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const submit = async (e: FormEvent) => { e.preventDefault(); await onUpdate(form); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const changePassword = async (e: FormEvent) => { e.preventDefault(); setPwMsg(''); if (!currentAdmin?.id) return setPwMsg('Admin bilgisi bulunamadı.'); if (newPassword.length < 8) return setPwMsg('Şifre en az 8 karakter olmalıdır.'); if (newPassword !== confirmPassword) return setPwMsg('Şifreler eşleşmiyor.'); await onUpdatePassword(currentAdmin.id, newPassword); setNewPassword(''); setConfirmPassword(''); setPwMsg('Şifre güncellendi. Güvenlik için çıkış yapılıyor.'); setTimeout(async () => { if (supabase) await supabase.auth.signOut(); localStorage.removeItem('dtim_admin'); window.location.reload(); }, 1500); };
  return <div className="p-4"><form onSubmit={submit} className="space-y-4"><h2 className="font-serif text-xl">Genel Ayarlar</h2><TextInput value={form.mosqueName || ''} onChange={e => change('mosqueName', e.target.value)} placeholder="Cami / Dernek Adı" /><TextInput value={form.shortName || ''} onChange={e => change('shortName', e.target.value)} placeholder="Kısa Başlık" /><PanelCard className="p-4 space-y-3"><h3 className="font-serif text-lg">Vipps / Bağış</h3><TextInput value={form.vippsNumber || ''} onChange={e => change('vippsNumber', e.target.value)} placeholder="Vipps Numarası" />{isSuperadmin && <><label className="block text-sm font-medium">Vipps Donation URL</label><TextInput value={form.vippsDonationUrl || ''} onChange={e => change('vippsDonationUrl', e.target.value)} placeholder="https://qr.vipps.no/..." /><p className="text-xs opacity-60">Lim inn Vipps Donation URL fra Vipps-portalen. Hvis feltet er tomt, brukes vanlig Vipps-nummer.</p></>}<label className="flex items-start gap-2 text-sm opacity-80"><input type="checkbox" className="mt-1" checked={form.vippsButtonEnabled !== false} onChange={e => change('vippsButtonEnabled', e.target.checked)} /><span><span className="font-medium">Vipps uygulamasında aç butonu aktif</span><br /><span className="text-xs opacity-50">Açık: Vipps butonu görünür. Kapalı: sadece numara ve kopyalama görünür.</span></span></label></PanelCard><TextInput value={form.whatsappNumber || ''} onChange={e => change('whatsappNumber', e.target.value)} placeholder="WhatsApp Numarası" /><TextArea className="resize-none" rows={3} value={form.address || ''} onChange={e => change('address', e.target.value)} placeholder="Adres" /><TextInput value={form.mapUrl || ''} onChange={e => change('mapUrl', e.target.value)} placeholder="Google Harita URL" />{isSuperadmin && <PanelCard className="p-4 space-y-3"><h3 className="font-serif text-lg">🌙 Ramazan Modülü</h3><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.ramadanEnabled || false} onChange={e => change('ramadanEnabled', e.target.checked)} />Ramazan Modu Aktif</label><TextInput type="date" value={form.ramadanStartDate || ''} onChange={e => change('ramadanStartDate', e.target.value)} /><TextInput type="date" value={form.ramadanEndDate || ''} onChange={e => change('ramadanEndDate', e.target.value)} /></PanelCard>}{isSuperadmin && <PanelCard className="p-4 space-y-3"><h3 className="font-serif text-lg">🐑 Kurban Bayramı Modülü</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.kurbanEnabled} onChange={e => change('kurbanEnabled', e.target.checked)} />Kurban Bayramı Aktif</label><TextInput type="date" value={form.kurbanStartDate || ''} onChange={e => { change('kurbanStartDate', e.target.value); change('kurbanEnabled', !!e.target.value); }} /></PanelCard>}{saved && <p className="text-sm text-green-700 flex items-center gap-2"><Check size={16} /> Kaydedildi.</p>}<button type="submit" className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2" style={primaryButtonStyle}><Save size={16} /> Ayarları Kaydet</button></form><form onSubmit={changePassword} className="mt-6 bg-white rounded-xl p-4 border-2 space-y-3" style={cardStyle}><h3 className="font-serif text-lg">Şifre Değiştir</h3><p className="text-xs opacity-50">Bu işlem sadece oturum açmış Supabase Auth kullanıcısının şifresini değiştirir. Değişiklikten sonra güvenlik için çıkış yapılır.</p><div className="relative"><TextInput type={showPw ? 'text' : 'password'} className="pr-12" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yeni şifre" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><TextInput type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Yeni şifre tekrar" />{pwMsg && <p className="text-sm opacity-70">{pwMsg}</p>}<button type="submit" className="w-full py-3 rounded-lg font-medium" style={secondaryButtonStyle}>Şifreyi Güncelle</button></form></div>;
}

function AdminsManager({ admins, onDelete, isSuperadmin }: any) {
  const [localAdmins, setLocalAdmins] = useState<any[]>(admins || []);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { setLocalAdmins(admins || []); }, [admins]);
  const submit = async (e: FormEvent) => { e.preventDefault(); setMsg(''); if (!isSuperadmin) return setMsg('Sadece Süper Admin yönetici ekleyebilir.'); if (!email.trim() || !email.includes('@')) return setMsg('Geçerli e-posta zorunludur.'); if (!displayName.trim()) return setMsg('Görünen ad zorunludur.'); if (password.length < 8) return setMsg('Şifre en az 8 karakter olmalıdır.'); if (!supabase) return setMsg('Sistem bağlantısı yok.'); setCreating(true); try { const { data: sessionData } = await supabase.auth.getSession(); const token = sessionData.session?.access_token; if (!token) { setMsg('Oturum bulunamadı. Çıkış yapıp tekrar giriş yapın.'); return; } const res = await fetch('/api/create-admin', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: email.trim(), password, displayName: displayName.trim(), role }) }); const result = await res.json(); if (!res.ok) { setMsg(result.error || 'Yönetici oluşturulamadı.'); return; } setLocalAdmins((prev) => [...prev, result.admin]); setEmail(''); setDisplayName(''); setPassword(''); setRole('admin'); setShowForm(false); setMsg('Yönetici oluşturuldu.'); } catch (err) { console.error(err); setMsg('Yönetici oluşturulurken hata oluştu.'); } finally { setCreating(false); } };
  return <div className="p-4"><h2 className="font-serif text-xl mb-4">Yönetici Hesapları</h2>{!isSuperadmin && <p className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">Bu alan sadece Süper Admin tarafından yönetilebilir.</p>}{isSuperadmin && !showForm && <AddButton label="Yeni Yönetici Ekle" onClick={() => setShowForm(true)} />}{showForm && <form onSubmit={submit} className="bg-white rounded-xl p-4 border-2 space-y-4 mb-4" style={cardStyle}><BackButton onClick={() => setShowForm(false)} /><p className="text-xs opacity-50">E-posta, görünen ad, geçici şifre og rolle girin. Systemet oppretter Supabase Auth-bruker og adminprofil automatisk.</p><TextInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" /><TextInput value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Görünen ad" /><TextInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Geçici şifre" /><SelectInput value={role} onChange={e => setRole(e.target.value as 'admin' | 'super_admin')}><option value="admin">Admin</option><option value="super_admin">Super Admin</option></SelectInput><button type="submit" disabled={creating} className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={primaryButtonStyle}><Save size={16} /> {creating ? 'Oluşturuluyor...' : 'Kaydet'}</button></form>}{msg && <p className="text-sm mb-3 opacity-70">{msg}</p>}{localAdmins?.length === 0 ? <EmptyState text="Henüz yönetici listesi yüklenmedi veya kayıt yok." /> : <div className="space-y-3">{localAdmins.map((admin: any) => <PanelCard key={admin.id} className="p-3 flex items-center gap-3"><div className="w-11 h-11 rounded-full flex items-center justify-center font-serif" style={secondaryButtonStyle}>{admin.display_name?.charAt(0) || admin.displayName?.charAt(0) || admin.username?.charAt(0)}</div><div className="flex-1"><h3 className="font-serif text-sm">{admin.display_name || admin.displayName || admin.username}</h3><p className="text-xs opacity-50">@{admin.username}</p><span className="text-[9px] uppercase" style={{ color: brand.primary }}>{admin.role}</span></div>{isSuperadmin && !isSuperAdminRole(admin.role) && <button onClick={() => { if (confirm('Bu yöneticiyi silmek istiyor musunuz?')) onDelete(admin.id); }} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-red-500" /></button>}</PanelCard>)}</div>}</div>;
}

function PushManager() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const sendPush = async () => { if (!title.trim() || !message.trim()) return alert('Başlık ve mesaj zorunludur.'); setSending(true); try { const cleanTitle = title.trim(); const cleanMessage = message.trim(); const res = await fetch('/api/send-push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: cleanTitle, body: cleanMessage }) }); if (!res.ok) throw new Error('Push gönderilemedi'); trackEvent('push_sent'); alert('Bildirim gönderildi.'); setTitle(''); setMessage(''); } catch (err) { console.error(err); alert('Bildirim gönderilirken hata oluştu.'); } finally { setSending(false); } };
  return <div className="p-4 space-y-4"><h2 className="font-serif text-xl">Toplu Bildirim Gönder</h2><PanelCard className="p-4 space-y-4"><TextInput placeholder="Başlık" value={title} onChange={e => setTitle(e.target.value)} /><TextArea rows={5} className="resize-none" placeholder="Mesaj" value={message} onChange={e => setMessage(e.target.value)} /><button type="button" onClick={sendPush} disabled={sending} className="w-full py-3 rounded-lg font-medium" style={primaryButtonStyle}>{sending ? 'Gönderiliyor...' : '📢 Bildirim Gönder'}</button></PanelCard></div>;
}

function StatsManager() {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => { void loadStats(); }, []);
  async function loadStats() { if (!supabase) return; const { data } = await supabase.from('analytics_events').select('event_type, created_at'); if (data) setEvents(data); }
  const cards = [{ label: 'App Açıldı', key: 'app_open', icon: '📱' }, { label: 'Haber Açıldı', key: 'news_open', icon: '📰' }, { label: 'Sohbet Açıldı', key: 'sohbet_open', icon: '🎤' }, { label: 'Bağış', key: 'donation_click', icon: '❤️' }, { label: 'İletişim', key: 'contact_click', icon: '📞' }, { label: 'Kurulum', key: 'install_click', icon: '📲' }, { label: 'Bildirim', key: 'push_sent', icon: '🔔' }];
  const countForRange = (key: string, days?: number) => { const now = new Date(); const start = days ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1) : null; return events.filter((e) => e.event_type === key && (!start || new Date(e.created_at) >= start)).length; };
  const sections = [{ title: '📅 Bugün', days: 1 }, { title: '📅 Son 7 Gün', days: 7 }, { title: '📅 Son 30 Gün', days: 30 }, { title: '🏆 Toplam', days: undefined }];
  return <div className="p-4 space-y-5"><h2 className="font-serif text-xl">İstatistik</h2>{sections.map(section => <PanelCard key={section.title} className="p-4"><h3 className="font-serif text-lg mb-3">{section.title}</h3><div className="grid grid-cols-2 gap-3">{cards.map(card => <div key={card.key} className="rounded-xl p-3" style={{ backgroundColor: mix(brand.primary, 9), color: brand.text }}><div className="text-xl mb-1">{card.icon}</div><p className="text-[11px] opacity-50">{card.label}</p><p className="font-serif text-xl">{countForRange(card.key, section.days)}</p></div>)}</div></PanelCard>)}</div>;
}
