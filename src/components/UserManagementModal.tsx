import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { LoaderCircle, MailPlus, RefreshCw, ShieldCheck, UserRoundCheck, X } from 'lucide-react';
import { UserRole } from '../types';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, accessToken }) => {
  const [members, setMembers] = useState<ManagedUser[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể tải danh sách tài khoản.');
      setMembers(payload.users || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách tài khoản.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen) void loadMembers();
  }, [isOpen, loadMembers]);

  if (!isOpen) return null;

  const inviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ email, fullName, role }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể gửi lời mời.');
      setEmail('');
      setFullName('');
      setRole('staff');
      setMessage('Đã tạo tài khoản và gửi email mời thiết lập mật khẩu.');
      await loadMembers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi lời mời.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateActiveStatus = async (user: ManagedUser) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action: 'setActive', userId: user.id, active: !user.is_active }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể cập nhật trạng thái.');
      setMembers((current) => current.map((item) => item.id === user.id ? { ...item, is_active: !item.is_active } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label="Quản lý tài khoản" className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
          <X className="h-5 w-5" />
        </button>
        <div className="pr-8">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><ShieldCheck className="h-5 w-5 text-red-800" /> Quản lý tài khoản</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Chỉ Chủ trung tâm có thể cấp hoặc khóa tài khoản. Hệ thống không có chức năng tự đăng ký.</p>
        </div>

        <form className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:grid-cols-2" onSubmit={inviteUser}>
          <label className="text-xs font-bold text-slate-700">Họ và tên
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={120} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600" />
          </label>
          <label className="text-xs font-bold text-slate-700">Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600" />
          </label>
          <label className="text-xs font-bold text-slate-700">Cấp bậc
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600">
              <option value="staff">Nhân viên</option>
              <option value="owner">Chủ trung tâm</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-red-800 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />} Gửi lời mời
            </button>
          </div>
        </form>

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p>}
        {message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">{message}</p>}

        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Tài khoản đã cấp</h3>
          <button onClick={() => void loadMembers()} disabled={isLoading || isSubmitting} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50" title="Tải lại">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {isLoading && members.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-500">Đang tải tài khoản…</div>
          ) : members.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-500">Chưa có tài khoản nào.</div>
          ) : members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3">
              {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500"><UserRoundCheck className="h-4 w-4" /></div>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">{member.full_name || 'Chưa đặt tên'}</p>
                <p className="truncate text-[11px] text-slate-500">{member.email}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${member.role === 'owner' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>{member.role === 'owner' ? 'Chủ trung tâm' : 'Nhân viên'}</span>
                <button onClick={() => void updateActiveStatus(member)} disabled={isSubmitting} className={`mt-1 block text-[11px] font-semibold hover:underline disabled:opacity-50 ${member.is_active ? 'text-emerald-700' : 'text-red-700'}`}>
                  {member.is_active ? 'Đang hoạt động · Khóa' : 'Đã khóa · Mở'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
