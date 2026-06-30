Import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ForgotPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'username' | 'question' | 'done'>('username');
  const [username, setUsername] = useState('');
  const [admin, setAdmin] = useState<any | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const findAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Kullanıcı adı zorunludur.');
      return;
    }

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

    if (error || !data) {
      setError('Kullanıcı bulunamadı.');
      return;
    }

    if (!data.security_question || !data.security_answer) {
      setError('Bu kullanıcı için güvenlik sorusu tanımlanmamış.');
      return;
    }

    setAdmin(data);
    setStep('question');
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!admin) {
      setError('Kullanıcı bilgisi bulunamadı.');
      return;
    }

    if (!answer.trim()) {
      setError('Güvenlik cevabı zorunludur.');
      return;
    }

    if (answer.trim().toLowerCase() !== String(admin.security_answer).trim().toLowerCase()) {
      setError('Güvenlik cevabı hatalı.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
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
      setError('Şifre güncellenemedi: ' + error.message);
      return;
    }

    setStep('done');
  };

  const closeAndReset = () => {
    setStep('username');
    setUsername('');
    setAdmin(null);
    setAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif text-xl">Şifremi Unuttum</h2>
          <button onClick={closeAndReset}>
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        {step === 'username' && (
          <form onSubmit={findAdmin} className="space-y-4">
            <input
              className="w-full p-3 border rounded-xl"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <button className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Devam Et'}
            </button>
          </form>
        )}

        {step === 'question' && admin && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="bg-white rounded-xl border p-3">
              <p className="text-xs text-[#2D2A26]/50 mb-1">Güvenlik Sorusu</p>
              <p className="text-sm font-medium">{admin.security_question}</p>
            </div>

            <input
              className="w-full p-3 border rounded-xl"
              placeholder="Cevabınız"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />

            <input
              type="password"
              className="w-full p-3 border rounded-xl"
              placeholder="Yeni Şifre"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              className="w-full p-3 border rounded-xl"
              placeholder="Yeni Şifre Tekrar"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Şifreyi Güncelle'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <p className="text-sm text-green-700">
              Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
            </p>

            <button
              onClick={closeAndReset}
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
