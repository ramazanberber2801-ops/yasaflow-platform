import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Loader2 } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { supabase } from '../lib/supabase';

export const AdminLoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(username, password);

    if (!success) {
      setError('Hatalı giriş!');
      setLoading(false);
      return;
    }

    const user = (await supabase?.auth.getUser())?.data.user;

    if (user?.user_metadata?.must_change_password === true) {
      setMustChangePassword(true);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (!supabase) {
      setError('Sistem bağlantısı yok.');
      return;
    }

    setChangingPassword(true);

    const { data: userData } = await supabase.auth.getUser();
    const currentMetadata = userData.user?.user_metadata || {};

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        ...currentMetadata,
        must_change_password: false,
      },
    });

    setChangingPassword(false);

    if (updateError) {
      setError('Şifre güncellenemedi: ' + updateError.message);
      return;
    }

    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMustChangePassword(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
        <div className="bg-[#FAF6F0] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between mb-6">
            <h2 className="font-serif text-xl">{mustChangePassword ? 'Yeni Şifre Belirle' : 'Yönetici Girişi'}</h2>
            <button onClick={onClose}><X size={20} /></button>
          </div>

          {!mustChangePassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <input
                className="w-full p-3 border rounded-xl"
                placeholder="E-posta"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full p-3 border rounded-xl"
                placeholder="Şifre"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label className="flex items-center gap-2 text-xs text-[#2D2A26]/60">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                />
                Şifreyi göster
              </label>
              <button type="submit" className="w-full bg-[#C5A880] text-white p-3 rounded-xl">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Giriş Yap'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="text-xs text-[#2D2A26]/60">
                Geçici şifre ile giriş yaptınız. Devam etmeden önce kalıcı bir şifre belirlemelisiniz.
              </p>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="w-full p-3 border rounded-xl"
                placeholder="Yeni şifre"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="w-full p-3 border rounded-xl"
                placeholder="Yeni şifre tekrar"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <label className="flex items-center gap-2 text-xs text-[#2D2A26]/60">
                <input
                  type="checkbox"
                  checked={showNewPassword}
                  onChange={e => setShowNewPassword(e.target.checked)}
                />
                Şifreleri göster
              </label>
              <button type="submit" className="w-full bg-[#C5A880] text-white p-3 rounded-xl">
                {changingPassword ? <Loader2 className="animate-spin mx-auto" /> : 'Yeni Şifreyi Kaydet'}
              </button>
            </form>
          )}

          {!mustChangePassword && (
            <button onClick={() => setShowForgot(true)} className="w-full text-xs text-[#C5A880] hover:underline mt-4">
              Şifremi Unuttum?
            </button>
          )}
        </div>
      </div>

      <ForgotPasswordModal
        open={showForgot}
        initialUsername={username}
        onClose={() => setShowForgot(false)}
      />
    </>
  );
};
