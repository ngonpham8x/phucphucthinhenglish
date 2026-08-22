import React, { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Logo } from './Logo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    setError(null);
    setIsSubmitting(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

    if (oauthError) {
      setError('Không thể kết nối Google. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-slate-100 grid place-items-center p-4">
        <section className="max-w-lg w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-7 text-center">
          <Logo size={76} className="mx-auto mb-4" />
          <h1 className="text-lg font-extrabold text-slate-900">Hệ thống chưa được cấu hình</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Thiếu cấu hình Supabase. Quản trị viên cần thêm biến môi trường VITE_SUPABASE_URL và
            VITE_SUPABASE_PUBLISHABLE_KEY trước khi sử dụng.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-red-950 grid place-items-center p-4">
      <section className="max-w-md w-full bg-white rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <Logo size={78} className="mx-auto mb-3" />
          <h1 className="font-extrabold text-red-900 text-lg">TRUNG TÂM ANH NGỮ PHÚC PHÚC THỊNH</h1>
          <p className="text-xs text-slate-500 mt-1">Hệ thống quản lý nội bộ</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
          Đăng nhập với Google
        </button>

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p>}
      </section>
    </main>
  );
};
