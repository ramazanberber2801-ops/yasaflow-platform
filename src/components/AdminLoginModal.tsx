import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, User, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setLoading(true);
      // 'admin' rolünü varsayılan olarak gönderiyoruz, böylece giriş mantığı basitleşiyor
      const success = await login(username, password, 'admin');
      
      if (success) {
        setUsername('');
        setPassword('');
        onClose();
      } else {
        setError('Hatalı kullanıcı adı veya şifre!');
      }
    } catch (err: any) {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] w-full max-w-md rounded-2xl shadow-2xl border-2 border-[#C5A880]/30 overflow-hidden">
        <div className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between border-b-2 border-[#C5A880]/20">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#C5A880]" />
            <h2 className="font-serif text-base text-[#FAF6F0]">Yönetici Girişi</h2>
          </div>
          <button onClick={onClose} className="text-[#FAF6F0]/60 hover:text-[#FAF6F0] transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle size={14} />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2D2A26]/60 uppercase tracking-wider">Kullanıcı Adı</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D2A26]/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C5A880]/20 text-sm focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2D2A26]/60 uppercase tracking-wider">Şifre</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D2A26]/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C5A880]/20 text-sm focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A880] hover:bg-[#B8935A] text-white py-3 rounded-xl font-medium text-sm transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};
