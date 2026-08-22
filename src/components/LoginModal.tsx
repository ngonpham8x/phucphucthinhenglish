import React, { FormEvent, useState } from 'react';
import { KeyRound, LoaderCircle, LogOut, ShieldCheck, X } from 'lucide-react';
import { UserAccount } from '../types';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLogout: () => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, currentUser, onLogout }) => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (updateError) {
      setError('Không thể đổi mật khẩu. Vui lòng thử lại.');
      return;
    }
    setPassword('');
    setMessage('Đã cập nhật mật khẩu.');
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    await onLogout();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label="Tài khoản" className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="" className="h-12 w-12 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-lg font-bold text-red-800">{currentUser.name.slice(0, 1).toUpperCase()}</div>
          )}
          <div>
            <h2 className="font-extrabold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-slate-500">Tài khoản đã xác thực</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              <ShieldCheck className="h-3 w-3" /> {currentUser.role === 'owner' ? 'Chủ trung tâm' : 'Nhân viên'}
            </span>
          </div>
        </div>

        <form className="mt-6 border-t border-slate-100 pt-5" onSubmit={handleChangePassword}>
          <label className="block text-xs font-bold text-slate-700">
            Đặt mật khẩu mới
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              required
              placeholder="Tối thiểu 12 ký tự"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600"
            />
          </label>
          <button type="submit" disabled={isSubmitting} className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-800 hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2">
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}<KeyRound className="h-4 w-4" /> Cập nhật mật khẩu
          </button>
        </form>

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p>}
        {message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">{message}</p>}

        <button onClick={handleLogout} disabled={isSubmitting} className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2">
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </section>
    </div>
  );
};
