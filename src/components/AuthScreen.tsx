import React, { FormEvent, useState } from 'react';
import { KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Mode = 'login' | 'reset';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);
    if (signInError) {
      setError('Không thể đăng nhập. Hãy kiểm tra email, mật khẩu và lời mời của quản trị viên.');
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError('Không thể kết nối Google. Vui lòng thử lại hoặc dùng email/mật khẩu.');
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setIsSubmitting(false);

    if (resetError) {
      setError('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
      return;
    }
    setMessage('Nếu email đã được cấp quyền, liên kết đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.');
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

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 mb-5 flex gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Không có đăng ký công khai. Chỉ tài khoản được Chủ trung tâm cấp quyền mới truy cập được.</span>
        </div>

        {mode === 'login' ? (
          <form className="space-y-3" onSubmit={handleEmailLogin}>
            <label className="block text-xs font-bold text-slate-700">
              Email
              <span className="relative block mt-1.5">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={254}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-red-600"
                />
              </span>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Mật khẩu
              <span className="relative block mt-1.5">
                <LockKeyhole className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={12}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-red-600"
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-red-800 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              Đăng nhập bằng email
            </button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={handlePasswordReset}>
            <p className="text-sm text-slate-600">Nhập email đã được cấp quyền để nhận liên kết đặt lại mật khẩu.</p>
            <label className="block text-xs font-bold text-slate-700">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
                className="w-full mt-1.5 rounded-xl border border-slate-300 py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-red-600"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-red-800 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              Gửi liên kết đặt lại
            </button>
          </form>
        )}

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p>}
        {message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">{message}</p>}

        <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400"><span className="h-px flex-1 bg-slate-200" />hoặc<span className="h-px flex-1 bg-slate-200" /></div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
        >
          Đăng nhập với Google
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(null); setMessage(null); }}
          className="mt-4 w-full text-xs font-semibold text-red-800 hover:underline flex justify-center items-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
          {mode === 'login' ? 'Quên mật khẩu?' : 'Quay lại đăng nhập'}
        </button>
      </section>
    </main>
  );
};
