import type { CenterBackupData } from "../types";

export const CENTER_COLLECTIONS = [
  "programs",
  "teachers",
  "rooms",
  "classes",
  "students",
  "timetableSlots",
  "grades",
  "receipts",
  "backups",
] as const;
export type CenterCollection = (typeof CENTER_COLLECTIONS)[number];
export type CenterPayload = CenterBackupData;
export interface CenterChanges {
  settings?: Record<string, unknown>;
  collections?: Partial<
    Record<
      CenterCollection,
      { upsert: Record<string, any>[]; remove: string[] }
    >
  >;
  events?: { id: string; action: string; module: string; details: string }[];
}
const derived: Partial<Record<CenterCollection, string[]>> = {
  students: ["feeStatus"],
  classes: ["studentIds"],
  teachers: ["assignedClassIds"],
  grades: ["average"],
};
const comparable = (value: unknown) => JSON.stringify(value ?? null);

// Send only actual edited fields. Never send a masked financial snapshot back
// as a replacement for the database, or delete records hidden by permissions.
export function buildCenterChanges(
  before: Partial<CenterPayload>,
  after: Partial<CenterPayload>,
): CenterChanges {
  const changes: CenterChanges = {};
  if (comparable(before.settings) !== comparable(after.settings))
    changes.settings = after.settings as any;
  for (const name of CENTER_COLLECTIONS) {
    const oldRows = new Map<string, any>(
      (before[name] || []).map((row: any) => [row.id, row] as [string, any]),
    );
    const newRows = new Map<string, any>(
      (after[name] || []).map((row: any) => [row.id, row] as [string, any]),
    );
    const upsert: Record<string, any>[] = [];
    for (const [id, row] of newRows) {
      const old = oldRows.get(id);
      const patch: Record<string, any> = { id };
      for (const key of new Set([
        ...Object.keys(old || {}),
        ...Object.keys(row),
      ])) {
        if (key === "id" || derived[name]?.includes(key)) continue;
        if (!old || comparable(old[key]) !== comparable(row[key]))
          patch[key] = row[key] ?? null;
      }
      if (Object.keys(patch).length > 1) upsert.push(patch);
    }
    const remove = [...oldRows.keys()].filter((id) => !newRows.has(id));
    if (upsert.length || remove.length)
      (changes.collections ||= {})[name] = { upsert, remove };
  }
  const previousIds = new Set((before.activityLogs || []).map((log) => log.id));
  const events = (after.activityLogs || []).filter(
    (log) => log.id.startsWith("LOG_") && !previousIds.has(log.id),
  );
  if (events.length)
    changes.events = events.map(({ id, action, module, details }) => ({
      id,
      action,
      module,
      details,
    }));
  return changes;
}
export const hasCenterChanges = (changes: CenterChanges) =>
  Boolean(
    changes.settings ||
    Object.keys(changes.collections || {}).length ||
    changes.events?.length,
  );
