import type { StaffPermissions, UserAccount } from "../types.js";

export const EMPTY_PERMISSIONS: StaffPermissions = {
  student: {
    view: false,
    add: false,
    edit: false,
    delete: false,
    export: false,
  },
  teacher: { view: false, edit: false, delete: false },
  tuition: { view: false, collect: false, delete: false, showDebt: false },
  grade: { view: false, edit: false },
  excel: { import: false, export: false },
  report: { view: false, revenue: false },
};

export function normalizePermissions(value: unknown): StaffPermissions {
  const input =
    value && typeof value === "object" ? (value as Record<string, any>) : {};
  const result = structuredClone(EMPTY_PERMISSIONS);
  for (const module of Object.keys(result) as (keyof StaffPermissions)[]) {
    for (const action of Object.keys(result[module])) {
      (result[module] as Record<string, boolean>)[action] =
        input[module]?.[action] === true;
    }
  }
  return result;
}

export const canSeeDebt = (owner: boolean, permissions: StaffPermissions) =>
  owner || (permissions.tuition.view && permissions.tuition.showDebt);
export const canSeeRevenue = (owner: boolean, permissions: StaffPermissions) =>
  owner || (permissions.report.view && permissions.report.revenue);
export const canExportCenter = (
  user: Pick<UserAccount, "role" | "permissions">,
) =>
  user.role === "owner" ||
  (user.permissions.excel.export &&
    user.permissions.student.view &&
    user.permissions.teacher.view &&
    user.permissions.tuition.view &&
    user.permissions.tuition.showDebt);
