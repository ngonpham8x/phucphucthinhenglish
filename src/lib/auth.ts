import type { User } from '@supabase/supabase-js';
import type { StaffPermissions, UserAccount, UserRole } from '../types';
import {EMPTY_PERMISSIONS,normalizePermissions} from './access';

export interface ProfileRow {
  id: string;
  email?: string | null;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  permissions: Partial<StaffPermissions> | null;
}

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = EMPTY_PERMISSIONS;

export const OWNER_PERMISSIONS: StaffPermissions = {
  student: { view: true, add: true, edit: true, delete: true, export: true },
  teacher: { view: true, edit: true, delete: true },
  tuition: { view: true, collect: true, delete: true, showDebt: true },
  grade: { view: true, edit: true },
  excel: { import: true, export: true },
  report: { view: true, revenue: true },
};

export const SYSTEM_OWNER_EMAILS: readonly string[] = [
  'phucphucthinhenglish@gmail.com',
];

export const DISPLAY_ROLE_LABEL_BY_EMAIL: Record<string, string> = {
  'phucphucthinhenglish@gmail.com': 'Hành chính',
};

export function isSystemOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return SYSTEM_OWNER_EMAILS.includes(email.trim().toLowerCase());
}

export function getDisplayRoleLabel(
  user?: { role?: UserRole | null; email?: string | null } | null,
  fallbackOwnerLabel = 'Chủ cơ sở',
  fallbackStaffLabel = 'Nhân viên',
): string {
  const normalizedEmail = (user?.email || '').trim().toLowerCase();
  if (normalizedEmail && DISPLAY_ROLE_LABEL_BY_EMAIL[normalizedEmail]) {
    return DISPLAY_ROLE_LABEL_BY_EMAIL[normalizedEmail];
  }
  return user?.role === 'owner' ? fallbackOwnerLabel : fallbackStaffLabel;
}

function mergePermissions(candidate: Partial<StaffPermissions> | null): StaffPermissions {
  return normalizePermissions(candidate);
}

export function profileToAccount(profile: ProfileRow, authUser: User): UserAccount {
  const email = (authUser.email || profile.email || '').trim().toLowerCase();
  const isSysOwner = isSystemOwnerEmail(email) || profile.role === 'owner';
  const fallbackName = authUser.user_metadata?.full_name || (email ? email.split('@')[0] : 'Chủ trung tâm');
  const fallbackAvatar = authUser.user_metadata?.avatar_url || '';

  return {
    id: profile.id,
    name: profile.full_name || fallbackName,
    email: email,
    avatar: profile.avatar_url || fallbackAvatar,
    role: isSysOwner ? 'owner' : profile.role,
    active: isSysOwner ? true : profile.is_active,
    permissions: isSysOwner ? OWNER_PERMISSIONS : mergePermissions(profile.permissions),
  };
}
