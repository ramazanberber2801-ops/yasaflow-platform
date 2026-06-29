function SettingsManager({ settings, onUpdate, currentAdmin, onUpdatePassword }: SettingsManagerProps) {
  const [form, setForm] = useState<MosqueSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleChange = (field: keyof MosqueSettings, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler uyuşmuyor!');
      return;
    }
    await onUpdatePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Genel Ayarlar Formu */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Genel Cami Ayarları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cami Adı</label>
            <input 
              type="text" 
              value={form.mosqueName} 
              onChange={(e) => handleChange('mosqueName', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          {/* Diğer inputlarınızı buraya eklemeye devam edebilirsiniz */}
        </div>
        <button type="submit" className="mt-4 bg-[#C5A880] text-white px-4 py-2 rounded">
          Kaydet
        </button>
      </form>

      {/* Şifre Değiştirme Bölümü */}
      <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Şifre Değiştir</h2>
        <input 
          type="password" 
          placeholder="Yeni Şifre" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input 
          type="password" 
          placeholder="Şifreyi Onayla" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded">
          Şifreyi Güncelle
        </button>
      </form>
    </div>
  );
}
