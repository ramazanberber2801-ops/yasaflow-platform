import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Loader2 } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { supabase } from '../lib/supabase';
import { useAppI18n } from '../lib/appI18n';

export const AdminLoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const { t } = useAppI18n();
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

  useEffect(() => {
    if (!supabase) return;

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (params.get('recovery') === '1' || hash.get('type') === 'recovery') {
      setMustChangePassword(true);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMustChangePassword(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(username, password);

    if (!success) {
      setError(t('login.invalid'));
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
      setError(t('recovery.tooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('recovery.noMatch'));
      return;
    }

    if (!supabase) {
      setError(t('recovery.noConnection'));
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
      setError(t('login.passwordUpdateFailed') + updateError.message);
      return;
    }

    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMustChangePassword(false);

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('recovery');
    cleanUrl.hash = '';
    window.history.replaceState({}, '', `${cleanUrl.pathname}${cleanUrl.search}`);

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 60%, transparent)' }}>
        <div className="theme-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border-2">
          <div className="flex justify-between mb-6">
            <h2 className="font-serif text-xl">{mustChangePassword ? t('recovery.title') : t('login.title')}</h2>
            <button onClick={onClose} aria-label={t('common.close')}><X size={20} /></button>
          </div>

          {!mustChangePassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <input
                type="email"
                className="theme-input w-full p-3 border rounded-xl"
                placeholder={t('login.email')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="theme-input w-full p-3 border rounded-xl"
                placeholder={t('login.password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label className="flex items-center gap-2 text-xs theme-muted">
                <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                {t('recovery.show')}
              </label>
              <button type="submit" className="theme-primary-button w-full p-3 rounded-xl font-medium disabled:opacity-60" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mx-auto" /> : t('login.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="text-xs theme-muted">{t('login.temporaryPassword')}</p>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="theme-input w-full p-3 border rounded-xl"
                placeholder={t('recovery.password')}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="theme-input w-full p-3 border rounded-xl"
                placeholder={t('recovery.repeat')}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <label className="flex items-center gap-2 text-xs theme-muted">
                <input type="checkbox" checked={showNewPassword} onChange={e => setShowNewPassword(e.target.checked)} />
                {t('login.showPasswords')}
              </label>
              <button type="submit" className="theme-primary-button w-full p-3 rounded-xl font-medium disabled:opacity-60" disabled={changingPassword}>
                {changingPassword ? <Loader2 className="animate-spin mx-auto" /> : t('login.savePassword')}
              </button>
            </form>
          )}

          {!mustChangePassword && (
            <button onClick={() => setShowForgot(true)} className="w-full text-xs mt-4 hover:underline" style={{ color: 'var(--brand-primary)' }}>
              {t('login.forgotPassword')}
            </button>
          )}
        </div>
      </div>

      <ForgotPasswordModal open={showForgot} initialUsername={username} onClose={() => setShowForgot(false)} />
    </>
  );
};
