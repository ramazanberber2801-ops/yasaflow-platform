import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SecuritySetupModal({
  open,
  admin,
  onDone,
}: {
  open: boolean;
  admin: any;
  onDone: () => void;
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  if (!open || !admin) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) return setError('Güvenlik sorusu zorunludur.');
    if (!answer.trim()) return setError('Güvenlik cevabı zorunludur.');

    const { error } = await supabase
      .from('admins')
      .update({
        security_question: question.trim(),
        security_answer: answer.trim().toLowerCase(),
      })
      .eq('id', admin.id);

    if (error) {
      setError('Kaydedilemedi: ' + error.message);
      return;
    }

    onDone();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif text-xl">Güvenlik Sorusu Oluştur</h2>
          <X size={20} className="opacity-40" />
        </div>

        <p className="text-xs text-[#2D2A26]/60 mb-4">
          Şifrenizi unutursanız hesabınızı geri alabilmek için bir güvenlik sorusu belirleyin.
        </p>

        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-red-500 text-xs">{error}</p>}

          <input
            className="w-full p-3 border rounded-xl"
            placeholder="Örn: İlk evcil hayvanımın adı?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <input
            className="w-full p-3 border rounded-xl"
            placeholder="Cevap"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <button className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2">
            <Save size={16} />
            Kaydet ve Devam Et
          </button>
        </form>
      </div>
    </div>
  );
}
