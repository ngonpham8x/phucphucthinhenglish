import assert from 'node:assert/strict';
import { localISODate, reportWeekBounds } from '../src/lib/date';
import {
  isRemovedActivityLog,
  formatLogModule,
  formatLogDetails,
  normalizeActivityLog,
  isHiddenAccountIdentity,
  containsHiddenAccountText,
} from '../src/lib/activityLog';
import type { ActivityLog } from '../src/types';
assert.equal(localISODate(new Date(2026,9,1,0,1)),'2026-10-01');
assert.deepEqual(reportWeekBounds('2026-10-12'),['2026-10-12','2026-10-18']);
assert.deepEqual(reportWeekBounds('2026-10-18'),['2026-10-12','2026-10-18']);
assert.deepEqual(reportWeekBounds('2026-01-01'),['2025-12-29','2026-01-04']);
assert.equal(isRemovedActivityLog({timestamp:'2026-10-05 17:35:20', details:'Điểm danh buổi học Unit 3 lớp Starters A1.'} as ActivityLog),true);
assert.equal(isRemovedActivityLog({timestamp:'2026-10-06 17:35:20', details:'Điểm danh buổi học Unit 3 lớp Starters A1.'} as ActivityLog),false);

// Test user-friendly activity log formatting
assert.equal(formatLogModule('receipts'), 'Học phí');
assert.equal(formatLogModule('students'), 'Học sinh');
assert.equal(formatLogModule('classes'), 'Lớp học');
assert.equal(formatLogModule('Xác thực'), 'Xác thực');

assert.equal(
  formatLogDetails({
    module: 'receipts',
    details: 'Thêm PT-2026-173. Trường: code, studentId, classId, courseFee, monthlyFee, paymentKind, billingPeriod, discount, paidAmount, debtAmount, status, paymentDate, collectorName, paymentMethod, notes.',
  }),
  'Tạo phiếu thu mới PT-2026-173',
);

assert.equal(
  formatLogDetails({
    module: 'students',
    details: 'Thêm HS078. Trường: code, name, dob, gender, school, gradeLevel, programId, classId, extraClassIds, address, email, phone, parentName, parentPhone, enrollDate, notes, status, parentConsent.',
  }),
  'Thêm mới học sinh HS078',
);

assert.equal(
  formatLogDetails({
    module: 'receipts',
    details: 'Cập nhật PT-2026-168. Trường: classId.',
  }),
  'Cập nhật phiếu thu PT-2026-168 (thay đổi: lớp học)',
);

const normalized = normalizeActivityLog({
  id: 'LOG_TEST',
  timestamp: '11:16:48 20/11/2026',
  userEmail: 'admin@example.com',
  userName: 'Admin',
  action: 'THÊM',
  module: 'receipts',
  details: 'Thêm PT-2026-173. Trường: code, studentId, classId.',
});
assert.equal(normalized.module, 'Học phí');
assert.equal(normalized.details, 'Tạo phiếu thu mới PT-2026-173');

assert.equal(isHiddenAccountIdentity('PHẠM DUY NGÔN', null), true);
assert.equal(isHiddenAccountIdentity('Duy Ngôn Phạm', null), true);
assert.equal(isHiddenAccountIdentity('Nhân viên', 'bhttq3@gmail.com'), true);
assert.equal(isHiddenAccountIdentity('Owner', 'ngonpham8x@gmail.com'), true);
assert.equal(isHiddenAccountIdentity('Owner', 'tayninhdoimoi@gmail.com'), true);
assert.equal(isHiddenAccountIdentity('Nguyễn Lương Danh', 'phucphucthinhenglish@gmail.com'), false);
assert.equal(containsHiddenAccountText('Đã thu hồi tài khoản PHẠM DUY NGÔN khỏi hệ thống.'), true);
assert.equal(containsHiddenAccountText('Cấp quyền Google cho bhttq3@gmail.com'), true);
assert.equal(containsHiddenAccountText('Cấp quyền Google cho nhanvien@gmail.com'), false);

console.log('Passed: local calendar dates, week boundaries, exact obsolete log matching, user-friendly activity log details.');
