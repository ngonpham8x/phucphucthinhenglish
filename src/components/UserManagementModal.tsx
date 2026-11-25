import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  LoaderCircle,
  ShieldCheck,
  UserRoundCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  UserPlus,
  Users,
  Briefcase,
  FileSpreadsheet,
  DollarSign,
  GraduationCap,
  Sparkles,
  Edit,
  RefreshCw,
  Trash2,
  UserX
} from 'lucide-react';
import { StaffPermissions, UserRole } from '../types';
import { OWNER_PERMISSIONS, isSystemOwnerEmail } from '../lib/auth';
import { normalizePermissions } from '../lib/access';
import { isHiddenAccountIdentity } from '../lib/activityLog';

interface ManagedUser {
  id: string;
  email?: string;
  full_name: string;
  avatar_url: string | null;
  role?: UserRole;
  is_active?: boolean;
  permissions?: StaffPermissions | null;
  created_at?: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onAccountChanged?: () => void;
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

const isHiddenMember = (member: ManagedUser): boolean =>
  isHiddenAccountIdentity(member.full_name, member.email);

interface RolePreset {
  id: string;
  name: string;
  role: UserRole;
  badgeClass: string;
  summary: string;
  responsibilities: string;
  defaultPermissions: StaffPermissions;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'owner',
    name: 'Chủ Trung Tâm',
    role: 'owner',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    summary: 'Toàn quyền điều hành cơ sở, quản trị tài chính & phân quyền',
    responsibilities: 'Toàn quyền sử dụng 100% tính năng hệ thống: quản lý học viên, giáo viên, lớp học, thời khóa biểu, điểm số, học phí, xóa phiếu thu, xem báo cáo doanh thu & công nợ, phân quyền tài khoản, nhập xuất Excel và sao lưu dữ liệu.',
    defaultPermissions: OWNER_PERMISSIONS,
  },
  {
    id: 'admin_office',
    name: 'Hành Chính',
    role: 'staff',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    summary: 'Quản lý hồ sơ học viên, xếp lớp, giáo viên và thời khóa biểu',
    responsibilities: 'Tiếp nhận học viên mới, tạo và chỉnh sửa hồ sơ học sinh, xếp lớp, quản lý danh sách giáo viên, sắp xếp thời khóa biểu và phòng học, xuất danh sách học viên và bảng điểm. Không phụ trách thu tiền hay xem doanh thu tài chính.',
    defaultPermissions: {
      student: { view: true, add: true, edit: true, delete: false, export: true },
      teacher: { view: true, edit: true, delete: false },
      tuition: { view: false, collect: false, delete: false, showDebt: false },
      grade: { view: true, edit: false },
      excel: { import: false, export: true },
      report: { view: false, revenue: false },
    },
  },
  {
    id: 'teacher',
    name: 'Giáo Viên',
    role: 'staff',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    summary: 'Theo dõi học sinh các lớp phụ trách và cập nhật kết quả điểm số',
    responsibilities: 'Xem danh sách học sinh theo lớp giảng dạy, xem lịch dạy và phòng học, nhập điểm kiểm tra định kỳ, chỉnh sửa và cập nhật bảng điểm rèn luyện của học viên. Không được truy cập học phí, công nợ hay báo cáo doanh thu.',
    defaultPermissions: {
      student: { view: true, add: false, edit: false, delete: false, export: false },
      teacher: { view: true, edit: false, delete: false },
      tuition: { view: false, collect: false, delete: false, showDebt: false },
      grade: { view: true, edit: true },
      excel: { import: false, export: false },
      report: { view: false, revenue: false },
    },
  },
  {
    id: 'staff',
    name: 'Nhân Viên',
    role: 'staff',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    summary: 'Hỗ trợ vận hành cơ sở, trực quầy lễ tân, thu học phí và tra cứu',
    responsibilities: 'Xem thông tin học viên, hỗ trợ phụ huynh tra cứu lịch học, thu học phí và in phiếu thu cho học viên, theo dõi tình trạng đóng phí và công nợ. Có thể được Chủ trung tâm bổ sung thêm các quyền hạn khác bên dưới.',
    defaultPermissions: {
      student: { view: true, add: true, edit: false, delete: false, export: false },
      teacher: { view: true, edit: false, delete: false },
      tuition: { view: true, collect: true, delete: false, showDebt: true },
      grade: { view: true, edit: false },
      excel: { import: false, export: false },
      report: { view: false, revenue: false },
    },
  },
  {
    id: 'custom',
    name: 'Tùy Chỉnh Khác',
    role: 'staff',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    summary: 'Tự do tick chọn từng quyền hạn cụ thể theo nhu cầu',
    responsibilities: 'Do Quản trị viên tự tay đánh dấu các quyền hạn cần thiết bên dưới tùy theo nhu cầu phân công công việc thực tế.',
    defaultPermissions: createEmptyPermissions(),
  },
];

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
    title: 'Học phí & Doanh thu',
    options: [
      { module: 'tuition', action: 'view', label: 'Xem học phí' },
      { module: 'tuition', action: 'collect', label: 'Thu học phí' },
      { module: 'tuition', action: 'delete', label: 'Xóa phiếu thu' },
      { module: 'tuition', action: 'showDebt', label: 'Xem công nợ', emphasis: true },
      { module: 'report', action: 'view', label: 'Xem báo cáo' },
      { module: 'report', action: 'revenue', label: 'Xem doanh thu', emphasis: true },
    ],
  },
  {
    title: 'Học vụ & Tệp Excel',
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

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  onAccountChanged
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'grant'>('list');
  const [members, setMembers] = useState<ManagedUser[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('admin_office');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('staff');
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(() =>
    structuredClone(ROLE_PRESETS[1].defaultPermissions)
  );

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể tải danh sách tài khoản.');
      setMembers(payload.users || []);
    } catch (requestError) {
      setNotification({
        type: 'error',
        message: requestError instanceof Error ? requestError.message : 'Không thể tải danh sách tài khoản.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen) {
      setNotification(null);
      void loadMembers();
    }
  }, [isOpen, loadMembers]);

  if (!isOpen) return null;

  // Lọc bỏ toàn bộ những email nhạy cảm được yêu cầu ẩn
  const visibleMembers = members.filter((member) => !isHiddenMember(member));

  const selectedPreset = ROLE_PRESETS.find((p) => p.id === selectedPresetId) || ROLE_PRESETS[0];

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const target = ROLE_PRESETS.find((p) => p.id === presetId);
    if (!target) return;

    setRole(target.role);
    setStaffPermissions(structuredClone(target.defaultPermissions));
  };

  const resetGrantForm = () => {
    setEditingEmail(null);
    setEmail('');
    setFullName('');
    handleSelectPreset('admin_office');
  };

  const togglePermission = (module: keyof StaffPermissions, action: string) => {
    setSelectedPresetId('custom');
    setStaffPermissions((current) => {
      const next = structuredClone(current);
      const mod = next[module] as Record<string, boolean>;
      mod[action] = !mod[action];

      if (module === 'tuition' && (next.tuition.collect || next.tuition.delete)) {
        if ((action === 'view' && !next.tuition.view) || (action === 'showDebt' && !next.tuition.showDebt)) {
          next.tuition.collect = false;
          next.tuition.delete = false;
        } else {
          next.tuition.view = true;
          next.tuition.showDebt = true;
        }
      }
      return next;
    });
  };

  const grantGoogleAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotification(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          role,
          permissions: role === 'staff' ? staffPermissions : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Cấp quyền không thành công.');
      }

      setNotification({
        type: 'success',
        message: editingEmail
          ? `Đã cập nhật quyền thành công cho tài khoản "${email.trim().toLowerCase()}".`
          : `Đã cấp quyền thành công cho tài khoản "${email.trim().toLowerCase()}". Người này chỉ cần đăng nhập Google để sử dụng ngay!`,
      });

      resetGrantForm();
      await loadMembers();
      onAccountChanged?.();
      setActiveTab('list');
    } catch (requestError) {
      setNotification({
        type: 'error',
        message: requestError instanceof Error ? requestError.message : 'Cấp quyền không thành công. Vui lòng kiểm tra lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserActiveStatus = async (user: ManagedUser) => {
    if (!user.id) return;
    setActionInProgressId(user.id);
    setNotification(null);

    const nextActive = !user.is_active;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          action: 'setActive',
          userId: user.id,
          active: nextActive,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể cập nhật trạng thái tài khoản.');

      setNotification({
        type: 'success',
        message: nextActive
          ? `Đã mở khóa tài khoản cho ${user.full_name || user.email}.`
          : `Đã khóa tài khoản của ${user.full_name || user.email}.`,
      });

      await loadMembers();
      onAccountChanged?.();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái tài khoản.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRevokeUser = async (user: ManagedUser) => {
    if (!user.id) return;
    const displayName = user.full_name || user.email || 'này';
    const emailText = user.email ? ` (${user.email})` : '';

    const confirmed = window.confirm(
      `CẢNH BÁO BẢO MẬT:\n\nBạn có chắc chắn muốn THU HỒI TOÀN BỘ QUYỀN và XÓA tài khoản "${displayName}"${emailText} khỏi hệ thống không?\n\nSau khi xóa, tài khoản này sẽ bị thu hồi toàn bộ quyền và không thể truy cập hệ thống nữa.`
    );
    if (!confirmed) return;

    setActionInProgressId(user.id);
    setNotification(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'delete',
          userId: user.id,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Không thể thu hồi hoặc xóa tài khoản.');
      }

      setNotification({
        type: 'success',
        message: payload.message || `Đã thu hồi toàn bộ quyền và xóa tài khoản "${displayName}" khỏi hệ thống thành công.`,
      });

      await loadMembers();
      onAccountChanged?.();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi khi thu hồi hoặc xóa tài khoản.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleEditPermissions = (user: ManagedUser) => {
    const normalizedEmail = (user.email || '').trim().toLowerCase();
    setEditingEmail(normalizedEmail || null);
    setEmail(user.email || '');
    setFullName(user.full_name || '');
    setRole(user.role || 'staff');

    if (user.role === 'owner') {
      setSelectedPresetId('owner');
      setStaffPermissions(structuredClone(OWNER_PERMISSIONS));
    } else {
      const normalized = normalizePermissions(user.permissions);
      if (normalized.grade.edit && !normalized.tuition.collect && !normalized.student.add) {
        setSelectedPresetId('teacher');
      } else if (normalized.student.add && normalized.teacher.edit && !normalized.tuition.collect) {
        setSelectedPresetId('admin_office');
      } else if (normalized.tuition.collect) {
        setSelectedPresetId('staff');
      } else {
        setSelectedPresetId('custom');
      }
      setStaffPermissions(normalized);
    }
    setActiveTab('grant');
  };

  const getMemberRoleBadge = (member: ManagedUser) => {
    if (member.role === 'owner') {
      return {
        title: 'Chủ Trung Tâm',
        className: 'bg-red-100 text-red-800 border-red-300',
      };
    }
    const perms = member.permissions;
    if (!perms) {
      return {
        title: 'Nhân Viên',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (perms.grade?.edit && !perms.tuition?.collect && !perms.student?.add) {
      return {
        title: 'Giáo Viên',
        className: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    }
    if (perms.student?.add && perms.teacher?.edit && !perms.tuition?.collect) {
      return {
        title: 'Hành Chính',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    }
    return {
      title: 'Nhân Viên',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  };

  const renderPermissionBadges = (role?: UserRole, permissions?: StaffPermissions | null) => {
    if (role === 'owner') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300">
          <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
          Toàn quyền Chủ Trung Tâm
        </span>
      );
    }

    if (!permissions) {
      return <span className="text-xs text-slate-400 italic">Chưa cấp quyền cụ thể</span>;
    }

    const tags: { label: string; color: string }[] = [];
    if (permissions.tuition?.collect) tags.push({ label: 'Thu học phí', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' });
    if (permissions.tuition?.showDebt) tags.push({ label: 'Xem công nợ', color: 'bg-amber-100 text-amber-800 border-amber-300' });
    if (permissions.tuition?.view && !permissions.tuition?.collect) tags.push({ label: 'Xem học phí', color: 'bg-teal-50 text-teal-700 border-teal-200' });
    if (permissions.tuition?.delete) tags.push({ label: 'Xóa phiếu thu', color: 'bg-rose-100 text-rose-800 border-rose-300' });

    if (permissions.student?.add) tags.push({ label: 'Thêm học viên', color: 'bg-blue-100 text-blue-800 border-blue-200' });
    if (permissions.student?.edit) tags.push({ label: 'Sửa học viên', color: 'bg-blue-50 text-blue-700 border-blue-200' });
    if (permissions.student?.view && !permissions.student?.add) tags.push({ label: 'Xem học viên', color: 'bg-slate-100 text-slate-700 border-slate-200' });
    if (permissions.student?.delete) tags.push({ label: 'Xóa học viên', color: 'bg-rose-50 text-rose-700 border-rose-200' });
    if (permissions.student?.export) tags.push({ label: 'Xuất danh sách HS', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' });

    if (permissions.grade?.edit) tags.push({ label: 'Nhập / sửa điểm', color: 'bg-purple-100 text-purple-800 border-purple-200' });
    if (permissions.grade?.view && !permissions.grade?.edit) tags.push({ label: 'Xem điểm', color: 'bg-slate-100 text-slate-700 border-slate-200' });

    if (permissions.report?.revenue) tags.push({ label: 'Xem doanh thu', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' });
    if (permissions.report?.view && !permissions.report?.revenue) tags.push({ label: 'Xem báo cáo', color: 'bg-slate-100 text-slate-700 border-slate-200' });

    if (permissions.excel?.export) tags.push({ label: 'Xuất Excel', color: 'bg-teal-100 text-teal-800 border-teal-200' });
    if (permissions.excel?.import) tags.push({ label: 'Nhập Excel', color: 'bg-teal-50 text-teal-700 border-teal-200' });

    if (permissions.teacher?.edit) tags.push({ label: 'Sửa giáo viên', color: 'bg-orange-100 text-orange-800 border-orange-200' });
    if (permissions.teacher?.view && !permissions.teacher?.edit) tags.push({ label: 'Xem giáo viên', color: 'bg-slate-100 text-slate-700 border-slate-200' });

    if (tags.length === 0) {
      return <span className="text-xs text-slate-400 italic">Chưa cấp quyền cụ thể</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag.label}
            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${tag.color}`}
          >
            {tag.label}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Phân quyền tài khoản nhân viên"
        className="relative max-h-[92vh] w-full max-w-4xl flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-red-800 via-red-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                PHÂN QUYỀN & QUẢN LÝ NHÂN VIÊN
              </h2>
              <p className="text-xs text-red-100">
                Chỉ Chủ cơ sở mới có quyền cấp, chỉnh sửa hoặc thu hồi quyền truy cập hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-red-200 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Danh Sách Đã Cấp Quyền</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'list' ? 'bg-white text-red-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {visibleMembers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('grant')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'grant'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Cấp Quyền / Chức Danh Mới</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void loadMembers()}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-red-700 hover:bg-slate-200/70 rounded-xl transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className="px-6 pt-3 flex-shrink-0">
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-semibold">{notification.message}</div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'list' ? (
            /* TAB 1: ACCOUNTS LIST & PERMISSIONS */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                    Tài khoản được phân quyền sử dụng hệ thống
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hiển thị các tài khoản email đã cấp quyền cùng danh mục quyền chi tiết
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetGrantForm();
                    setActiveTab('grant');
                  }}
                  className="px-3.5 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>Cấp Quyền Mới</span>
                </button>
              </div>

              {isLoading && visibleMembers.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <LoaderCircle className="w-6 h-6 animate-spin text-red-700" />
                  <span>Đang tải danh sách tài khoản đã cấp quyền…</span>
                </div>
              ) : visibleMembers.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Chưa có tài khoản nhân viên nào được cấp quyền.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Bấm nút "Cấp Quyền Mới" ở góc trên để phân quyền tài khoản Google cho nhân viên.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {visibleMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-red-100 text-red-800 font-extrabold flex items-center justify-center flex-shrink-0 text-sm">
                            {(member.full_name || member.email || 'N')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{member.full_name || 'Chưa đặt tên'}</span>
                            {(() => {
                              const roleBadge = getMemberRoleBadge(member);
                              return (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${roleBadge.className}`}>
                                  {roleBadge.title}
                                </span>
                              );
                            })()}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                member.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {member.is_active !== false ? '🟢 Đang hoạt động' : '🔴 Đã khóa'}
                            </span>
                          </div>

                          <div className="text-xs font-mono font-bold text-slate-600 mt-1 flex items-center gap-1.5">
                            <span className="text-slate-400 font-sans font-normal text-[11px]">Email đăng nhập Google:</span>
                            <span className="text-red-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {member.email || 'Chưa ghi nhận email'}
                            </span>
                          </div>

                          <div className="mt-2.5">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Quyền hạn được cấp:
                            </div>
                            {renderPermissionBadges(member.role, member.permissions)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleEditPermissions(member)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
                          title="Sửa quyền hạn của tài khoản này"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Sửa quyền</span>
                        </button>

                        {isSystemOwnerEmail(member.email) ? (
                          <span
                            className="px-2.5 py-1.5 bg-amber-50 text-amber-900 font-bold text-[11px] rounded-xl border border-amber-200 flex items-center gap-1"
                            title="Tài khoản Chủ trung tâm mặc định được bảo vệ, không thể khóa hoặc xóa"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            <span>Tài khoản gốc bảo vệ</span>
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={actionInProgressId === member.id}
                              onClick={() => void toggleUserActiveStatus(member)}
                              className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border ${
                                member.is_active !== false
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={member.is_active !== false ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {actionInProgressId === member.id ? (
                                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                              ) : member.is_active !== false ? (
                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>{member.is_active !== false ? 'Khóa' : 'Mở khóa'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={actionInProgressId === member.id}
                              onClick={() => void handleRevokeUser(member)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200"
                              title="Thu hồi toàn bộ quyền và xóa tài khoản khỏi hệ thống"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Thu hồi / Xóa</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: GRANT NEW PERMISSION / ROLES */
            <form className="space-y-6" onSubmit={grantGoogleAccess}>
              {editingEmail && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-950">
                  <div>
                    <span className="font-extrabold">Đang chỉnh sửa quyền cho: </span>
                    <span className="font-mono font-bold text-blue-900">{editingEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetGrantForm}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 font-bold hover:bg-blue-100"
                  >
                    Chuyển sang cấp mới
                  </button>
                </div>
              )}

              {/* Preset Role Selector: 4 Main Roles (Chủ Trung Tâm, Hành Chính, Giáo Viên, Nhân Viên) */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2 tracking-wide flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-red-800" />
                  Bước 1: Chọn Vai trò (Hệ thống tự động kích hoạt quyền tương ứng)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {ROLE_PRESETS.slice(0, 4).map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-red-700 bg-red-50/90 ring-2 ring-red-700/30 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="font-black text-xs text-slate-900">{preset.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${preset.badgeClass}`}>
                            {preset.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {preset.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Chọn 1 trong 4 vai trò để hệ thống tự động tick sẵn các quyền tiêu chuẩn.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('custom')}
                    className={`text-xs font-bold underline transition-colors ${
                      selectedPresetId === 'custom' ? 'text-red-700 font-black' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {selectedPresetId === 'custom' ? '● Đang mở chế độ Tùy chỉnh quyền tự do' : '⚙️ Tự do tick chọn quyền tùy chỉnh'}
                  </button>
                </div>
              </div>

              {/* Role Responsibilities Detailed Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wide">
                    Chức năng nhiệm vụ của vai trò: {selectedPreset.name}
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedPreset.responsibilities}
                </p>
                <div className="mt-2 text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hệ thống đã tự động chọn sẵn các quyền tiêu chuẩn của vai trò này bên dưới.</span>
                </div>
              </div>

              {/* User Identity Inputs */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2 tracking-wide">
                  Bước 2: Thông tin tài khoản nhân viên
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên nhân viên *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email đăng nhập Google *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={Boolean(editingEmail)}
                      required
                      maxLength={254}
                      placeholder="Ví dụ: nhanvien@gmail.com"
                      className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600 ${editingEmail ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'}`}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Nhân viên sẽ dùng tài khoản Google này để đăng nhập vào hệ thống.
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Permission Checkboxes (Only for staff roles) */}
              {role === 'staff' && (
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-2 tracking-wide">
                    Bước 3: Tùy chỉnh chi tiết quyền hạn (đã tick sẵn theo vai trò)
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {permissionGroups.map((group) => (
                        <div key={group.title} className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                          <p className="mb-2.5 text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                            {group.title}
                          </p>
                          <div className="space-y-2">
                            {group.options.map((option) => {
                              const checked = Boolean(
                                (staffPermissions[option.module] as Record<string, boolean>)?.[option.action]
                              );
                              return (
                                <label
                                  key={`${option.module}.${option.action}`}
                                  className={`flex cursor-pointer items-start gap-2.5 text-xs font-semibold select-none ${
                                    option.emphasis ? 'text-amber-900' : 'text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePermission(option.module, option.action)}
                                    className="mt-0.5 rounded border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                                  />
                                  <span>{option.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Quay lại danh sách
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 font-bold text-xs text-white disabled:opacity-60 flex items-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Đang lưu và phân quyền…</span>
                    </>
                  ) : (
                    <>
                      <UserRoundCheck className="h-4 w-4 text-amber-300" />
                      <span>Xác Nhận & Cấp Quyền Google</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div>
            Hệ thống quản lý nội bộ • Trung Tâm Anh Ngữ Phúc Phúc Thịnh
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </section>
    </div>
  );
};
