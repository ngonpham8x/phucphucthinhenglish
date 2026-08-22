import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { LoaderCircle, MailPlus, ShieldCheck, UserRoundCheck, X } from 'lucide-react';
import { StaffPermissions, UserRole } from '../types';

interface ManagedUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
}

const EMPTY_STAFF_PERMISSIONS: StaffPermissions = {
  student: { view: false, add: false, edit: false, delete: false, export: false },
  teacher: { view: false, edit: false, delete: false },
  tuition: { view: false, collect: false, delete: false, showDebt: false },
  grade: { view: false, edit: false },
  excel: { import: false, export: false },
  report: { view: false, revenue: false },
};

const createEmptyPermissions = (): StaffPermissions => JSON.parse(JSON.stringify(EMPTY_STAFF_PERMISSIONS)) as StaffPermissions;

const permissionGroups: { title: string; options: { module: keyof StaffPermissions; action: string; label: string; emphasis?: boolean }[] }[] = [
  {
    title: 'Học viên',
    options: [
      { module: 'student', action: 'view', label: 'Xem học viên' },
      { module: 'student', action: 'add', label: 'Thêm học viên' },
      { module: 'student', action: 'edit', label: 'Sửa học viên' },
      { module: 'student', action: 'delete', label: 'Xóa học viên' },
      { module: 'student', action: 'export', label: 'Xuất danh sách' },
    ],
  },
  {
    title: 'Học phí & báo cáo',
    options: [
      { module: 'tuition', action: 'view', label: 'Xem học phí' },
      { module: 'tuition', action: 'collect', label: 'Thu học phí' },
      { module: 'tuition', action: 'showDebt', label: 'Xem công nợ', emphasis: true },
      { module: 'report', action: 'view', label: 'Xem báo cáo' },
      { module: 'report', action: 'revenue', label: 'Xem doanh thu', emphasis: true },
    ],
  },
  {
    title: 'Học vụ & tệp dữ liệu',
    options: [
      { module: 'teacher', action: 'view', label: 'Xem giáo viên' },
      { module: 'teacher', action: 'edit', label: 'Sửa giáo viên' },
      { module: 'grade', action: 'view', label: 'Xem điểm' },
      { module: 'grade', action: 'edit', label: 'Nhập / sửa điểm' },
      { module: 'excel', action: 'import', label: 'Nhập Excel' },
      { module: 'excel', action: 'export', label: 'Xuất Excel' },
    ],
  },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, accessToken }) => {
  const [members, setMembers] = useState<ManagedUser[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(createEmptyPermissions);
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

  const togglePermission = (module: keyof StaffPermissions, action: string) => {
    setStaffPermissions((current) => ({
      ...current,
      [module]: {
        ...(current[module] as Record<string, boolean>),
        [action]: !(current[module] as Record<string, boolean>)[action],
      },
    } as StaffPermissions));
  };

  const inviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ email, fullName, role, permissions: role === 'staff' ? staffPermissions : undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể gửi lời mời.');
      setEmail('');
      setFullName('');
      setRole('staff');
      setStaffPermissions(createEmptyPermissions());
      setMessage('Đã tạo tài khoản và gửi email mời thiết lập mật khẩu.');
      await loadMembers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi lời mời.');
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
          {role === 'staff' && (
            <fieldset className="sm:col-span-2 rounded-xl border border-red-200 bg-white p-3">
              <legend className="px-1 text-xs font-extrabold text-red-900">Quyền cho nhân viên</legend>
              <p className="mb-3 text-[11px] leading-4 text-slate-500">Chỉ tick các quyền cần thiết. Mặc định nhân viên không có quyền nào; quyền doanh thu và công nợ nên cấp riêng.</p>
              <div className="grid gap-3 md:grid-cols-3">
                {permissionGroups.map((group) => (
                  <div key={group.title} className="rounded-lg bg-slate-50 p-2.5">
                    <p className="mb-2 text-[11px] font-extrabold uppercase text-slate-700">{group.title}</p>
                    <div className="space-y-1.5">
                      {group.options.map((option) => {
                        const checked = Boolean((staffPermissions[option.module] as Record<string, boolean>)[option.action]);
                        return (
                          <label key={`${option.module}.${option.action}`} className={`flex cursor-pointer items-start gap-2 text-[11px] font-medium ${option.emphasis ? 'text-amber-900' : 'text-slate-700'}`}>
                            <input type="checkbox" checked={checked} onChange={() => togglePermission(option.module, option.action)} className="mt-0.5 rounded border-slate-300 text-red-700 focus:ring-red-600" />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex items-end">
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-red-800 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />} Gửi lời mời
            </button>
          </div>
        </form>

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p>}
        {message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">{message}</p>}

        <div className="mt-6">
          <h3 className="font-bold text-slate-900">Tài khoản đang đăng nhập</h3>
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
          {isLoading && members.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-500">Đang tải tài khoản…</div>
          ) : members.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-500">Không tìm thấy tài khoản đang đăng nhập.</div>
          ) : members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3">
              {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500"><UserRoundCheck className="h-4 w-4" /></div>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">{member.full_name || 'Chưa đặt tên'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
