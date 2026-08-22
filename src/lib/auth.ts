import type { User } from '@supabase/supabase-js';
import type { StaffPermissions, UserAccount, UserRole } from '../types';

export interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  permissions: Partial<StaffPermissions> | null;
}

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  student: { view: true, add: true, edit: true, delete: false, export: false },
  teacher: { view: true, edit: true, delete: false },
  tuition: { view: true, collect: true, delete: false, showDebt: false },
  grade: { view: true, edit: true },
  excel: { import: true, export: false },
  report: { view: false, revenue: false },
};

export const OWNER_PERMISSIONS: StaffPermissions = {
  student: { view: true, add: true, edit: true, delete: true, export: true },
  teacher: { view: true, edit: true, delete: true },
  tuition: { view: true, collect: true, delete: true, showDebt: true },
  grade: { view: true, edit: true },
  excel: { import: true, export: true },
  report: { view: true, revenue: true },
};

function mergePermissions(candidate: Partial<StaffPermissions> | null): StaffPermissions {
  return {
    student: { ...DEFAULT_STAFF_PERMISSIONS.student, ...candidate?.student },
    teacher: { ...DEFAULT_STAFF_PERMISSIONS.teacher, ...candidate?.teacher },
    tuition: { ...DEFAULT_STAFF_PERMISSIONS.tuition, ...candidate?.tuition },
    grade: { ...DEFAULT_STAFF_PERMISSIONS.grade, ...candidate?.grade },
    excel: { ...DEFAULT_STAFF_PERMISSIONS.excel, ...candidate?.excel },
    report: { ...DEFAULT_STAFF_PERMISSIONS.report, ...candidate?.report },
  };
}

export function profileToAccount(profile: ProfileRow, authUser: User): UserAccount {
  const fallbackName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Người dùng';
  const fallbackAvatar = authUser.user_metadata?.avatar_url || '';

  return {
    id: profile.id,
    name: profile.full_name || fallbackName,
    // Email addresses stay in Supabase Auth and are never rendered by the app.
    email: '',
    avatar: profile.avatar_url || fallbackAvatar,
    role: profile.role,
    active: profile.is_active,
    permissions: profile.role === 'owner' ? OWNER_PERMISSIONS : mergePermissions(profile.permissions),
  };
}
