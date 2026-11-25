import type { ActivityLog } from '../types.js';

export const MODULE_LABELS: Record<string, string> = {
  receipts: 'Học phí',
  students: 'Học sinh',
  classes: 'Lớp học',
  teachers: 'Giáo viên',
  programs: 'Chương trình học',
  rooms: 'Phòng học',
  timetableSlots: 'Thời khóa biểu',
  grades: 'Điểm số',
  backups: 'Sao lưu',
  settings: 'Cài đặt',
  auth: 'Xác thực',
};

export const FIELD_LABELS: Record<string, string> = {
  code: 'mã',
  name: 'họ tên',
  fullName: 'họ tên',
  avatar: 'ảnh đại diện',
  dob: 'ngày sinh',
  gender: 'giới tính',
  school: 'trường học',
  gradeLevel: 'khối lớp',
  programId: 'chương trình',
  classId: 'lớp học',
  extraClassIds: 'lớp học thêm',
  address: 'địa chỉ',
  email: 'email',
  phone: 'số điện thoại',
  parentName: 'họ tên phụ huynh',
  parentPhone: 'SĐT phụ huynh',
  parentConsent: 'cam kết phụ huynh',
  enrollDate: 'ngày nhập học',
  notes: 'ghi chú',
  status: 'trạng thái',
  feeStatus: 'học phí',
  specialty: 'chuyên môn',
  scheduleNotes: 'ghi chú lịch',
  capacity: 'sĩ số',
  scheduleTime: 'giờ học',
  days: 'ngày học',
  category: 'phân loại',
  tuitionFee: 'mức học phí',
  description: 'mô tả',
  roomId: 'phòng học',
  teacherId: 'giáo viên',
  dayOfWeek: 'thứ',
  startTime: 'giờ bắt đầu',
  endTime: 'giờ kết thúc',
  listening: 'nghe',
  speaking: 'nói',
  reading: 'đọc',
  writing: 'viết',
  midterm: 'giữa kỳ',
  finalExam: 'cuối kỳ',
  attendance: 'chuyên cần',
  courseFee: 'học phí khóa',
  monthlyFee: 'học phí tháng',
  paymentKind: 'loại thu phí',
  billingPeriod: 'kỳ thu phí',
  discount: 'miễn giảm',
  paidAmount: 'số tiền nộp',
  debtAmount: 'công nợ',
  paymentDate: 'ngày nộp',
  paymentMethod: 'phương thức TT',
  collectorName: 'người thu',
  filename: 'tệp sao lưu',
  timestamp: 'thời gian',
  sizeKb: 'dung lượng',
  type: 'loại',
  centerName: 'tên trung tâm',
};

export const formatLogModule = (module: string): string => {
  if (!module) return 'Hệ thống';
  const trimmed = module.trim();
  const lower = trimmed.toLowerCase();
  return MODULE_LABELS[lower] || MODULE_LABELS[trimmed] || trimmed;
};

export const formatLogDetails = (
  log: { details?: string; module?: string; action?: string } | string,
): string => {
  const details = (typeof log === 'string' ? log : log?.details || '').trim();
  if (!details) return '';

  const rawModule = typeof log === 'string' ? '' : (log?.module || '');
  const moduleLower = rawModule.trim().toLowerCase();

  // Pattern: (Thêm|Cập nhật) <identifier>. Trường: <fields>.
  const schemaMatch = details.match(/^(Thêm|Cập nhật)\s+([^.]+?)\.\s*Trường:\s*(.+)$/i);
  if (schemaMatch) {
    const rawAction = schemaMatch[1].toLowerCase();
    const identifier = schemaMatch[2].trim();
    const fieldsRaw = schemaMatch[3].replace(/\.*$/, '').trim();
    const fieldTokens = fieldsRaw.split(',').map((s) => s.trim()).filter(Boolean);

    // If it was "Thêm", don't display the raw schema fields dump
    if (rawAction === 'thêm') {
      if (identifier.startsWith('PT-') || moduleLower === 'receipts' || rawModule === 'Học phí') {
        return `Tạo phiếu thu mới ${identifier}`;
      }
      if (identifier.startsWith('HS') || moduleLower === 'students' || rawModule === 'Học sinh') {
        return `Thêm mới học sinh ${identifier}`;
      }
      if (moduleLower === 'classes' || rawModule === 'Lớp học') {
        return `Tạo lớp học mới ${identifier}`;
      }
      if (moduleLower === 'teachers' || rawModule === 'Giáo viên') {
        return `Thêm giáo viên mới ${identifier}`;
      }
      if (moduleLower === 'rooms' || rawModule === 'Phòng học') {
        return `Thêm phòng học mới ${identifier}`;
      }
      if (moduleLower === 'programs' || rawModule === 'Chương trình học') {
        return `Tạo chương trình học mới ${identifier}`;
      }
      return `Thêm mới ${identifier}`;
    }

    // If it was "Cập nhật"
    const translatedFields = fieldTokens.map((f) => FIELD_LABELS[f] || f);
    const fieldSummary = translatedFields.length > 0 ? ` (thay đổi: ${translatedFields.join(', ')})` : '';

    if (identifier.startsWith('PT-') || moduleLower === 'receipts' || rawModule === 'Học phí') {
      return `Cập nhật phiếu thu ${identifier}${fieldSummary}`;
    }
    if (identifier.startsWith('HS') || moduleLower === 'students' || rawModule === 'Học sinh') {
      return `Cập nhật thông tin học sinh ${identifier}${fieldSummary}`;
    }
    if (moduleLower === 'classes' || rawModule === 'Lớp học') {
      return `Cập nhật thông tin lớp học ${identifier}${fieldSummary}`;
    }
    if (moduleLower === 'teachers' || rawModule === 'Giáo viên') {
      return `Cập nhật thông tin giáo viên ${identifier}${fieldSummary}`;
    }
    if (moduleLower === 'rooms' || rawModule === 'Phòng học') {
      return `Cập nhật phòng học ${identifier}${fieldSummary}`;
    }
    return `Cập nhật ${identifier}${fieldSummary}`;
  }

  // Handle generic "Xóa <ID>." when module is known
  const deleteMatch = details.match(/^Xóa\s+([^.]+)\.?$/i);
  if (deleteMatch) {
    const identifier = deleteMatch[1].trim();
    if (identifier.startsWith('PT-') || moduleLower === 'receipts' || rawModule === 'Học phí') {
      return `Xóa phiếu thu ${identifier}`;
    }
    if (identifier.startsWith('HS') || moduleLower === 'students' || rawModule === 'Học sinh') {
      return `Xóa học sinh ${identifier}`;
    }
    if (moduleLower === 'classes' || rawModule === 'Lớp học') {
      return `Xóa lớp học ${identifier}`;
    }
    if (moduleLower === 'teachers' || rawModule === 'Giáo viên') {
      return `Xóa giáo viên ${identifier}`;
    }
  }

  return details;
};

export const normalizeActivityLog = (log: ActivityLog): ActivityLog => {
  return {
    ...log,
    module: formatLogModule(log.module),
    details: formatLogDetails(log),
  };
};

export const HIDDEN_ACCOUNT_EMAILS: readonly string[] = [
  'ngonpham8x@gmail.com',
  'tayninhdoimoi@gmail.com',
  'bhttq3@gmail.com',
];

export const HIDDEN_ACCOUNT_NAMES: readonly string[] = [
  'pham duy ngon',
  'duy ngon pham',
];

export const normalizeAccountIdentity = (value?: string | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const isHiddenAccountIdentity = (name?: string | null, email?: string | null): boolean => {
  const normEmail = (email || '').trim().toLowerCase();
  if (normEmail && HIDDEN_ACCOUNT_EMAILS.includes(normEmail)) return true;
  const normName = normalizeAccountIdentity(name);
  if (normName && (HIDDEN_ACCOUNT_NAMES.includes(normName) || HIDDEN_ACCOUNT_EMAILS.includes(normName))) {
    return true;
  }
  return false;
};

export const containsHiddenAccountText = (text?: string | null): boolean => {
  const norm = normalizeAccountIdentity(text);
  if (!norm) return false;
  return HIDDEN_ACCOUNT_EMAILS.some((item) => norm.includes(item))
    || HIDDEN_ACCOUNT_NAMES.some((item) => norm.includes(item));
};

// Remove only the three obsolete entries identified in the system-log screenshot.
export const isRemovedActivityLog = (log: ActivityLog): boolean => {
  const timestamp = log.timestamp.trim();
  return (timestamp === '2026-10-05 08:30:15' && log.details === 'Đăng nhập vào hệ thống quản lý trung tâm BEEZONE.')
    || (timestamp === '2026-10-05 17:35:20' && log.details === 'Điểm danh buổi học Unit 3 lớp Starters A1.')
    || (/^14:35:51,?\s*12\/10\/2026$/.test(timestamp) && log.action === 'ĐĂNG NHẬP');
};
