import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon,
  UserCog, Check, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880]";

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    news, staff, sohbet, settings, admins, currentAdmin, logout,
    addNews, updateNews, deleteNews,
    addStaff, updateStaff, deleteStaff,
    addSohbet, updateSohbet, deleteSohbet,
    updateSettings, addAdmin, deleteAdmin, updateAdminPassword
  } = useApp();

  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  const isSuperadmin = currentAdmin?.role === 'superadmin';

  const handleLogout = () => {
    logout();
    onClose();
  };

  const tabs = [
    { id: 'news' as AdminTab, label: 'Haberler', icon: Newspaper },
    { id: 'sohbet' as AdminTab, label: 'Sohbet/Ders', icon: Mic },
    { id: 'staff' as AdminTab, label: 'Yönetim', icon: Users },
    { id: 'settings' as AdminTab, label: 'Ayarlar', icon: SettingsIcon },
    { id: 'admins' as AdminTab, label: 'Yöneticiler', icon: UserCog },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C5A880]/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-[#C5A880]" />
          </div>
          <div>
            <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
            <p className="text-[10px] text-[#FAF6F0]/50">
              {currentAdmin?.displayName || currentAdmin?.username || 'Admin'} · {isSuperadmin ? 'Süper Admin' : 'Admin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF6F0]/10 text-[#FAF6F0] text-xs">
            <LogOut size={14} /> Çıkış
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-[#FAF6F0]/10 flex items-center justify-center">
            <X size={18} className="text-[#FAF6F0]" />
          </button>
        </div>
      </header>

      <div className="flex border-b-2 border-[#C5A880]/20 bg-white shrink-0 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[78px] flex items-center justify-center gap-1.5 py-3 text-xs font-medium relative ${
                tab === t.id ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A880]" />}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto">
        {tab === 'news' && <NewsManager items={news} onAdd={addNews} onUpdate={updateNews} onDelete={deleteNews} />}
        {tab === 'sohbet' && <SohbetManager items={sohbet} onAdd={addSohbet} onUpdate={updateSohbet} onDelete={deleteSohbet} />}
        {tab === 'staff' && <StaffManager items={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} />}
        {tab === 'settings' && <SettingsManager settings={settings} onUpdate={updateSettings} currentAdmin={currentAdmin} onUpdatePassword={updateAdminPassword} />}
        {tab === 'admins' && <AdminsManager admins={admins} onAdd={addAdmin} onDelete={deleteAdmin} isSuperadmin={isSuperadmin} />}
      </main>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-[#2D2A26]/60 mb-4">
      <ArrowLeft size={16} /> Geri
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full mb-4 py-3 rounded-xl bg-[#C5A880] text-white font-medium flex items-center justify-center gap-2">
      <Plus size={18} /> {label}
    </button>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <button onClick={onEdit} className="w-8 h-8 rounded-lg bg-[#C5A880]/10 flex items-center justify-center">
        <Edit3 size={14} className="text-[#C5A880]" />
      </button>
      <button onClick={onDelete} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
        <Trash2 size={14} className="text-red-500" />
      </button>
    </div>
  );
}

function SaveCancelButtons({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-lg bg-white border border-[#C5A880]/30 text-sm">
        İptal
      </button>
      <button type="submit" className="flex-1 py-3 rounded-lg bg-[#C5A880] text-white text-sm font-medium flex items-center justify-center gap-2">
        <Save size={16} /> Kaydet
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl p-8 text-center border-2 border-[#C5A880]/25">
      <p className="text-sm text-[#2D2A26]/50">{text}</p>
    </div>
  );
}

/* NEWS */

function NewsManager({ items, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (showForm || editing) {
    return <NewsForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={() => { setEditing(null); setShowForm(false); }} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Haber Ekle" onClick={() => setShowForm(true)} />

      {items.length === 0 ? <EmptyState text="Henüz haber eklenmemiş." /> : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const imageSrc = item.imageBase64 || item.image_base64;
            return (
              <div key={item.id} className="bg-white rounded-xl p-3 border-2 border-[#C5A880]/25 flex gap-3">
                {imageSrc && <img src={imageSrc} className="w-16 h-16 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#C5A880] uppercase">{item.category}</span>
                  <h3 className="font-serif text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-[#2D2A26]/50 truncate">{item.content}</p>
                </div>
                <ActionButtons onEdit={() => setEditing(item)} onDelete={() => {
                  if (confirm('Bu haberi silmek istiyor musunuz?')) onDelete(item.id);
                }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewsForm({ item, onAdd, onUpdate, onClose }: any) {
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [category, setCategory] = useState(item?.category || 'Duyuru');
  const [imageBase64, setImageBase64] = useState(item?.imageBase64 || item?.image_base64 || '');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToOptimizedBase64(file);
    setImageBase64(base64);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Başlık zorunludur.');
    if (!content.trim()) return setError('İçerik zorunludur.');

const data = {
  id: item?.id || `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: title.trim(),
  content: content.trim(),
  category,
  image_base64: imageBase64,
  date: item?.date || new Date().toISOString()
};

    if (item) await onUpdate(item.id, data);
    else await onAdd(data);

    onClose();
  };

  return (
    <div className="p-4">
      <BackButton onClick={onClose} />
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-serif text-xl">{item ? 'Haberi Düzenle' : 'Yeni Haber'}</h2>

        {imageBase64 ? (
          <div className="relative">
            <img src={imageBase64} className="w-full h-40 object-cover rounded-xl" />
            <button type="button" onClick={() => setImageBase64('')} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <label className="h-32 border-2 border-dashed border-[#C5A880]/30 rounded-xl flex flex-col items-center justify-center cursor-pointer">
            <Upload size={20} className="text-[#C5A880]" />
            <span className="text-xs text-[#2D2A26]/50">Resim seç</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
          </label>
        )}

        <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık" />

        <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}>
          <option>Duyuru</option>
          <option>Etkinlik</option>
          <option>Eğitim</option>
          <option>Ramazan</option>
          <option>Diğer</option>
        </select>

        <textarea className={`${inputClass} resize-none`} rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="İçerik" />

        {error && <p className="text-sm text-red-600">{error}</p>}
        <SaveCancelButtons onCancel={onClose} />
      </form>
    </div>
  );
}

/* SOHBET */

function SohbetManager({ items, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (showForm || editing) {
    return <SohbetForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={() => { setEditing(null); setShowForm(false); }} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Sohbet / Ders Ekle" onClick={() => setShowForm(true)} />

      {items.length === 0 ? <EmptyState text="Henüz sohbet/ders eklenmemiş." /> : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl p-3 border-2 border-[#C5A880]/25 flex gap-3">
              <div className="w-14 h-14 rounded-lg bg-[#2D2A26] text-[#FAF6F0] flex flex-col items-center justify-center">
                <span className="text-[9px] text-[#C5A880]">{item.date}</span>
                <span className="font-serif text-sm">{item.time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-sm truncate">{item.title}</h3>
                <p className="text-xs text-[#2D2A26]/50 truncate">{item.description}</p>
                <p className="text-[10px] text-[#2D2A26]/40">{item.speaker}</p>
              </div>
              <ActionButtons onEdit={() => setEditing(item)} onDelete={() => {
                if (confirm('Bu programı silmek istiyor musunuz?')) onDelete(item.id);
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SohbetForm({ item, onAdd, onUpdate, onClose }: any) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [date, setDate] = useState(item?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(item?.time || '19:00');
  const [location, setLocation] = useState(item?.location || 'Dernek Merkezi - Drammen');
  const [speaker, setSpeaker] = useState(item?.speaker || '');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Başlık zorunludur.');
    if (!description.trim()) return setError('Açıklama zorunludur.');
    if (!speaker.trim()) return setError('Konuşmacı zorunludur.');

 const data = {
  id: item?.id || `sohbet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  description,
  date,
  time,
  location,
  speaker
};

if (item) {
  await onUpdate(item.id, data);
} else {
  await onAdd(data);
}

onClose();
};

  return (
    <div className="p-4">
      <BackButton onClick={onClose} />
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-serif text-xl">{item ? 'Sohbet/Ders Düzenle' : 'Yeni Sohbet / Ders'}</h2>

        <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık" />
        <textarea className={`${inputClass} resize-none`} rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama" />

        <div className="grid grid-cols-2 gap-3">
          <input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} />
          <input type="time" className={inputClass} value={time} onChange={e => setTime(e.target.value)} />
        </div>

        <input className={inputClass} value={location} onChange={e => setLocation(e.target.value)} placeholder="Konum" />
        <input className={inputClass} value={speaker} onChange={e => setSpeaker(e.target.value)} placeholder="Konuşmacı" />

        {error && <p className="text-sm text-red-600">{error}</p>}
        <SaveCancelButtons onCancel={onClose} />
      </form>
    </div>
  );
}

/* STAFF / YÖNETİM */

function StaffManager({ items, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (showForm || editing) {
    return <StaffForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={() => { setEditing(null); setShowForm(false); }} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Yönetim Üyesi Ekle" onClick={() => setShowForm(true)} />

      {items.length === 0 ? <EmptyState text="Henüz yönetim üyesi eklenmemiş." /> : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl p-3 border-2 border-[#C5A880]/25 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#C5A880] flex items-center justify-center text-white font-serif">
                {item.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-sm truncate">{item.name}</h3>
                <p className="text-xs text-[#C5A880]">{item.position}</p>
                {item.phone && <p className="text-xs text-[#2D2A26]/50">{item.phone}</p>}
              </div>
              <ActionButtons onEdit={() => setEditing(item)} onDelete={() => {
                if (confirm('Bu yönetim üyesini silmek istiyor musunuz?')) onDelete(item.id);
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffForm({ item, onAdd, onUpdate, onClose }: any) {
  const [name, setName] = useState(item?.name || '');
  const [position, setPosition] = useState(item?.position || '');
  const [phone, setPhone] = useState(item?.phone || '');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('İsim zorunludur.');
    if (!position.trim()) return setError('Görev zorunludur.');

    const data = { name, position, phone };

    if (item) await onUpdate(item.id, data);
    else await onAdd(data);

    onClose();
  };

  return (
    <div className="p-4">
      <BackButton onClick={onClose} />
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-serif text-xl">{item ? 'Yönetim Üyesini Düzenle' : 'Yeni Yönetim Üyesi'}</h2>

        <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad" />
        <input className={inputClass} value={position} onChange={e => setPosition(e.target.value)} placeholder="Başkan, Sekreter, Muhasip..." />
        <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon opsiyonel" />

        {error && <p className="text-sm text-red-600">{error}</p>}
        <SaveCancelButtons onCancel={onClose} />
      </form>
    </div>
  );
}

/* SETTINGS */

function SettingsManager({ settings, onUpdate, currentAdmin, onUpdatePassword }: any) {
  const [form, setForm] = useState<any>(settings || {});
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const change = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg('');

    if (!currentAdmin?.id) return setPwMsg('Admin bilgisi bulunamadı.');
    if (newPassword.length < 6) return setPwMsg('Şifre en az 6 karakter olmalıdır.');
    if (newPassword !== confirmPassword) return setPwMsg('Şifreler eşleşmiyor.');

    await onUpdatePassword(currentAdmin.id, newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPwMsg('Şifre güncellendi.');
  };

  return (
    <div className="p-4">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-serif text-xl">Genel Ayarlar</h2>

        <input className={inputClass} value={form.mosqueName || ''} onChange={e => change('mosqueName', e.target.value)} placeholder="Cami / Dernek Adı" />
        <input className={inputClass} value={form.shortName || ''} onChange={e => change('shortName', e.target.value)} placeholder="Kısa Başlık" />
        <input className={inputClass} value={form.vippsNumber || ''} onChange={e => change('vippsNumber', e.target.value)} placeholder="Vipps Numarası" />
        <input className={inputClass} value={form.whatsappNumber || ''} onChange={e => change('whatsappNumber', e.target.value)} placeholder="WhatsApp Numarası" />
        <textarea className={`${inputClass} resize-none`} rows={3} value={form.address || ''} onChange={e => change('address', e.target.value)} placeholder="Adres" />
        <input className={inputClass} value={form.mapUrl || ''} onChange={e => change('mapUrl', e.target.value)} placeholder="Google Harita URL" />
        <input className={inputClass} value={form.fridayPrayer || ''} onChange={e => change('fridayPrayer', e.target.value)} placeholder="Cuma Namazı Saati" />

        {saved && <p className="text-sm text-green-700 flex items-center gap-2"><Check size={16} /> Kaydedildi.</p>}

        <button type="submit" className="w-full py-3 rounded-lg bg-[#C5A880] text-white font-medium flex items-center justify-center gap-2">
          <Save size={16} /> Ayarları Kaydet
        </button>
      </form>

      <form onSubmit={changePassword} className="mt-6 bg-white rounded-xl p-4 border-2 border-[#C5A880]/25 space-y-3">
        <h3 className="font-serif text-lg">Şifre Değiştir</h3>

        <div className="relative">
          <input type={showPw ? 'text' : 'password'} className={`${inputClass} pr-12`} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yeni şifre" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <input type={showPw ? 'text' : 'password'} className={inputClass} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Yeni şifre tekrar" />

        {pwMsg && <p className="text-sm text-[#2D2A26]/70">{pwMsg}</p>}

        <button type="submit" className="w-full py-3 rounded-lg bg-[#2D2A26] text-[#FAF6F0] font-medium">
          Şifreyi Güncelle
        </button>
      </form>
    </div>
  );
}

/* ADMINS */

function AdminsManager({ admins, onAdd, onDelete, isSuperadmin }: any) {
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');

    if (!isSuperadmin) return setMsg('Sadece Süper Admin yönetici ekleyebilir.');
    if (!username.trim()) return setMsg('Kullanıcı adı zorunludur.');
    if (!displayName.trim()) return setMsg('Görünen ad zorunludur.');
    if (password.length < 6) return setMsg('Şifre en az 6 karakter olmalıdır.');

await onAdd({
  id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  username: username.trim(),
  display_name: displayName.trim(),
  password,
  role: 'admin',
  security_question: null,
  security_answer: null,
});

    setUsername('');
    setDisplayName('');
    setPassword('');
    setShowForm(false);
    setMsg('Yönetici eklendi.');
  };

  return (
    <div className="p-4">
      <h2 className="font-serif text-xl mb-4">Yönetici Hesapları</h2>

      {!isSuperadmin && (
        <p className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          Bu alan sadece Süper Admin tarafından yönetilebilir.
        </p>
      )}

      {isSuperadmin && !showForm && (
        <AddButton label="Yeni Yönetici Ekle" onClick={() => setShowForm(true)} />
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl p-4 border-2 border-[#C5A880]/25 space-y-4 mb-4">
          <BackButton onClick={() => setShowForm(false)} />
          <input className={inputClass} value={username} onChange={e => setUsername(e.target.value)} placeholder="Kullanıcı adı" />
          <input className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Görünen ad" />
          <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="Şifre" />
          <SaveCancelButtons onCancel={() => setShowForm(false)} />
        </form>
      )}

      {msg && <p className="text-sm mb-3 text-[#2D2A26]/70">{msg}</p>}

      {admins?.length === 0 ? <EmptyState text="Henüz yönetici listesi yüklenmedi veya kayıt yok." /> : (
        <div className="space-y-3">
          {admins.map((admin: any) => (
            <div key={admin.id} className="bg-white rounded-xl p-3 border-2 border-[#C5A880]/25 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#2D2A26] flex items-center justify-center text-white font-serif">
                {admin.displayName?.charAt(0) || admin.username?.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-sm">{admin.displayName || admin.username}</h3>
                <p className="text-xs text-[#2D2A26]/50">@{admin.username}</p>
                <span className="text-[9px] text-[#C5A880] uppercase">{admin.role}</span>
              </div>

              {isSuperadmin && admin.role !== 'superadmin' && (
                <button onClick={() => {
                  if (confirm('Bu yöneticiyi silmek istiyor musunuz?')) onDelete(admin.id);
                }} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
