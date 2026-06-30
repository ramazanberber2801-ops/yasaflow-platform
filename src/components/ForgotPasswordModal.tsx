import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ForgotPasswordModal({
  open,
  onClose,
  initialUsername,
}: {
  open: boolean;
  onClose: () => void;
  initialUsername?: string;
}) {
  const [step, setStep] = useState<'username' | 'question' | 'done'>('username');
  const [username, setUsername] = useState(initialUsername || '');
  const [admin, setAdmin] = useState<any | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialUsername?.trim()) {
      setUsername(initialUsername.trim());

      setTimeout(() => {
        const form = document.getElementById('forgot-password-form') as HTMLFormElement | null;
        form?.requestSubmit();
      }, 0);
    }
  }, [open, initialUsername]);

  if (!open) return null;

  const findAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const client = supabase;
    if (!client) {
      setError('Sistem bağlantısı yok.');
      return;
    }

    setLoading(true);

    const { data, error } = await client
      .from('admins')
      .select('id, username, security_question, security_answer')
      .eq('username', username.trim())
      .maybeSingle();

    setLoading(false);

    if (error || !data) return setError('Kullanıcı bulunamadı.');
    if (!data.security_question || !data.security_answer) {
      return setError('Güvenlik sorusu tanımlı değil.');
    }

    setAdmin(data);
    setStep('question');
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!admin) return setError('Kullanıcı bilgisi bulunamadı.');

    if (
      answer.trim().toLowerCase() !==
      String(admin.security_answer).trim().toLowerCase()
    ) {
      return setError('Cevap hatalı.');
    }

    if (newPassword.length < 6) {
      return setError('Yeni şifre en az 6 karakter olmalıdır.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Şifreler eşleşmiyor.');
    }

    const client = supabase;
    if (!client) {
      setError('Sistem bağlantısı yok.');
      return;
    }

    setLoading(true);

    const { error } = await client
      .from('admins')
      .update({ password: newPassword })
      .eq('id', admin.id);

    setLoading(false);

    if (error) {
      setError('Hata: ' + error.message);
      return;
    }

    setStep('done');
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between mb-5">
          <h2 className="font-serif text-xl">Şifremi Sıfırla</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        {step === 'username' && (
          <form id="forgot-password-form" onSubmit={findAdmin} className="space-y-4">
            <input
              className="w-full p-3 border rounded-xl"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <button className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Devam Et'}
            </button>
          </form>
        )}

        {step === 'question' && (
          <form onSubmit={resetPassword} className="space-y-4">
            <p className="text-sm font-medium bg-white p-3 rounded-lg border">
              {admin?.security_question}
            </p>

            <input
              className="w-full p-3 border rounded-xl"
              placeholder="Cevap"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full p-3 border rounded-xl"
              placeholder="Yeni Şifre"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full p-3 border rounded-xl"
              placeholder="Tekrar"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button className="w-full bg-[#C5A880] text-white p-3 rounded-xl">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Güncelle'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <p className="text-sm text-green-700">
              Şifreniz güncellendi. Giriş yapabilirsiniz.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium"
            >
              Girişe Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
