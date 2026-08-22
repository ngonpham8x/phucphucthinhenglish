import React, { useState } from 'react';
import { LogOut, ShieldCheck, X } from 'lucide-react';
import { UserAccount } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLogout: () => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, currentUser, onLogout }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

        <button onClick={handleLogout} disabled={isSubmitting} className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2">
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </section>
    </div>
  );
};
