import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppI18n } from '../lib/appI18n';

export function ForgotPasswordModal({
  open,
  onClose,
  initialUsername,
}: {
  open: boolean;
  onClose: () => void;
  initialUsername?: string;
}) {
  const { t } = useAppI18n();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initialUsername || '');
      setMessage('');
      setError('');
      setLoading(false);
    }
  }, [open, initialUsername]);

  if (!open) return null;

  const sendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(t('forgot.emailRequired'));
      return;
    }

    const client = supabase;
    if (!client) {
      setError(t('recovery.noConnection'));
      return;
    }

    setLoading(true);

    const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    });

    setLoading(false);

    if (error) {
      setError(t('forgot.sendFailed') + error.message);
      return;
    }

    setMessage(t('forgot.sent'));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 70%, transparent)' }}>
      <div className="theme-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border-2">
        <div className="flex justify-between mb-5">
          <h2 className="font-serif text-xl">{t('forgot.title')}</h2>
          <button onClick={onClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        <p className="text-xs theme-muted mb-4">{t('forgot.description')}</p>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        {message && <p className="text-green-700 text-xs mb-3">{message}</p>}

        <form onSubmit={sendResetEmail} className="space-y-4">
          <input
            type="email"
            className="theme-input w-full p-3 border rounded-xl"
            placeholder={t('login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="theme-primary-button w-full p-3 rounded-xl font-medium disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : t('forgot.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
