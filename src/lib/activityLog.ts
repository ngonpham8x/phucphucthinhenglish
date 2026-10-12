import type { ActivityLog } from '../types';

// Remove only the three obsolete entries identified in the system-log screenshot.
export const isRemovedActivityLog = (log: ActivityLog): boolean => {
  const timestamp = log.timestamp.trim();
  return (timestamp === '2026-10-05 08:30:15' && log.details === 'Đăng nhập vào hệ thống quản lý trung tâm BEEZONE.')
    || (timestamp === '2026-10-05 17:35:20' && log.details === 'Điểm danh buổi học Unit 3 lớp Starters A1.')
    || (/^14:35:51,?\s*12\/10\/2026$/.test(timestamp) && log.action === 'ĐĂNG NHẬP');
};
