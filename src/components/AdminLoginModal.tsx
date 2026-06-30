import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, User, Shield, Loader2, AlertCircle } from 'lucide-react';

export const AdminLoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password, 'admin');
    if (success) onClose();
    else setError('Hatalı giriş bilgileri!');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-xl">Yönetici Girişi</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <input className="w-full p-3 border rounded-xl" placeholder="Kullanıcı Adı" onChange={e => setUsername(e.target.value)} />
          <input type="password" className="w-full p-3 border rounded-xl" placeholder="Şifre" onChange={e => setPassword(e.target.value)} />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
            Beni Hatırla
          </label>
          <button className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium">
            <button
  type="button"
  onClick={() => setShowForgot(true)}
  className="w-full text-xs text-[#C5A880] hover:underline mt-2"
>
  Şifremi Unuttum?
</button>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};
