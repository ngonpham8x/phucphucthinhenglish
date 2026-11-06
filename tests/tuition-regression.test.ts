import assert from 'node:assert/strict';
import {
  debtBreakdown,
  feeStatusForReceipts,
  reconcileReceiptBalances,
  nextReceiptCode,
  suggestNextCoursePeriod,
  getStudentCourseProgress
} from '../src/lib/tuition';
import { getEnrolledStudentsForClass, getStudentClassIds } from '../src/lib/student';
import type { TuitionReceipt, Student, ClassRoom } from '../src/types';

const receipt = (values: Partial<TuitionReceipt>): TuitionReceipt => ({
  id: 'first', code: 'PT-001', studentId: 'A', classId: '10', courseFee: 4_000_000,
  paymentKind: 'course', billingPeriod: 'Khóa 2026', discount: 0,
  paidAmount: 2_000_000, debtAmount: 2_000_000, paymentDate: '2026-08-10',
  collectorName: 'Test', paymentMethod: 'Tiền mặt', ...values,
});
const first = receipt({});
const final = receipt({ id: 'final', code: 'PT-002', paymentDate: '2026-10-10', debtAmount: 0 });
let receipts = reconcileReceiptBalances([final, first]);
assert.equal(receipts.filter(r => r.paymentDate.startsWith('2026-10')).reduce((n, r) => n + r.paidAmount, 0), 2_000_000);
assert.equal(receipts.filter(r => r.paymentDate.startsWith('2026-08')).reduce((n, r) => n + r.paidAmount, 0), 2_000_000);
assert.equal(debtBreakdown(receipts).total, 0);
assert.equal(feeStatusForReceipts(receipts), 'paid');
receipts = reconcileReceiptBalances(receipts.filter(r => r.id !== 'final'));
assert.equal(debtBreakdown(receipts).total, 2_000_000);
assert.equal(feeStatusForReceipts(receipts), 'partial');
const discounted = reconcileReceiptBalances([
  receipt({ discount: 500_000 }),
  receipt({ id: 'second', discount: 500_000, paidAmount: 1_000_000, paymentDate: '2026-09-10' }),
]);
assert.equal(debtBreakdown(discounted).total, 500_000);
assert.equal(debtBreakdown(reconcileReceiptBalances([final, first, receipt({id: 'other', classId: '11'})])).total, 2_000_000);
const classroom = { id: '10', studentIds: ['A', 'B', 'C', 'D', 'E', 'F'] } as ClassRoom;
const students = ['A', 'B', 'C', 'D', 'E', 'F'].map((id, index) => ({ id, classId: index < 3 ? '10' : '11' } as Student));
assert.equal(getEnrolledStudentsForClass(classroom, students).length, 6);
assert.deepEqual(getStudentClassIds(students[3], [classroom]).sort(), ['10', '11']);
console.log('Passed: installments, monthly revenue, deletion, discounts, separate class debts, six-student roster, multiple classes.');

const multiMonth = reconcileReceiptBalances([
 receipt({}),
 receipt({id:'oct-1',paidAmount:500_000,paymentDate:'2026-10-01'}),
 receipt({id:'oct-2',paidAmount:1_500_000,paymentDate:'2026-10-10'}),
]);
assert.equal(debtBreakdown(multiMonth.filter(r => r.paymentDate.startsWith('2026-10'))).total,0);
assert.equal(nextReceiptCode([{code:'PT-2026-095'},{code:'PT-2026-129'}],2026),'PT-2026-130');
assert.equal(nextReceiptCode([{code:'PT-2025-999'}],2026),'PT-2026-001');

// Test exam prep course levels: Mức độ 1 -> Mức độ 2 -> Mức độ 3
assert.equal(suggestNextCoursePeriod('Mức độ 1'), 'Mức độ 2');
assert.equal(suggestNextCoursePeriod('Mức độ 1 (Khóa 3 tháng)'), 'Mức độ 2 (Khóa 3 tháng)');
assert.equal(suggestNextCoursePeriod('Mức độ 2'), 'Mức độ 3');
assert.equal(suggestNextCoursePeriod('Level 1'), 'Level 2');
assert.equal(suggestNextCoursePeriod('Khóa 1'), 'Khóa 2');
assert.equal(suggestNextCoursePeriod('Khóa 01/2026–03/2026'), 'Khóa 04/2026–06/2026');
assert.equal(suggestNextCoursePeriod('Khóa 10/2026–12/2026'), 'Khóa 01/2027–03/2027');
assert.equal(suggestNextCoursePeriod('Khóa 2026'), 'Khóa 2026 - Mức độ 2 (Khóa 3 tháng)');
assert.equal(suggestNextCoursePeriod(''), 'Mức độ 2 (Khóa 3 tháng)');

// Test student finishes Level 1 (Mức độ 1) and pays for Level 2 (Mức độ 2)
const level1Receipt = receipt({
  id: 'r-level-1',
  code: 'PT-2026-001',
  studentId: 'HS_IELTS_01',
  classId: 'LOP_IELTS',
  courseFee: 4_500_000,
  paymentKind: 'course',
  billingPeriod: 'Mức độ 1',
  paidAmount: 4_500_000,
  debtAmount: 0,
  paymentDate: '2026-08-01'
});
const level2Receipt = receipt({
  id: 'r-level-2',
  code: 'PT-2026-002',
  studentId: 'HS_IELTS_01',
  classId: 'LOP_IELTS',
  courseFee: 4_500_000,
  paymentKind: 'course',
  billingPeriod: 'Mức độ 2',
  paidAmount: 4_500_000,
  debtAmount: 0,
  paymentDate: '2026-11-01'
});

const multiCourseLedger = reconcileReceiptBalances([level1Receipt, level2Receipt]);
assert.equal(multiCourseLedger.length, 2);
assert.equal(multiCourseLedger[0].status, 'paid');
assert.equal(multiCourseLedger[0].debtAmount, 0);
assert.equal(multiCourseLedger[1].status, 'paid');
assert.equal(multiCourseLedger[1].debtAmount, 0);
assert.equal(debtBreakdown(multiCourseLedger).total, 0);
assert.equal(feeStatusForReceipts(multiCourseLedger), 'paid');

// Test partial payment for Level 2
const level2Partial = receipt({
  ...level2Receipt,
  paidAmount: 2_500_000,
  debtAmount: 2_000_000,
});
const partialLedger = reconcileReceiptBalances([level1Receipt, level2Partial]);
assert.equal(debtBreakdown(partialLedger).total, 2_000_000);
assert.equal(feeStatusForReceipts(partialLedger), 'partial');

// Test student course progress detection
const progressAfterLevel1 = getStudentCourseProgress('HS_IELTS_01', 'LOP_IELTS', [level1Receipt]);
assert.equal(progressAfterLevel1.hasCompletedCourse, true);
assert.equal(progressAfterLevel1.nextSuggestedPeriod, 'Mức độ 2');
assert.equal(progressAfterLevel1.suggestedFee, 4_500_000);

const progressAfterLevel2 = getStudentCourseProgress('HS_IELTS_01', 'LOP_IELTS', [level1Receipt, level2Receipt]);
assert.equal(progressAfterLevel2.hasCompletedCourse, true);
assert.equal(progressAfterLevel2.nextSuggestedPeriod, 'Mức độ 3');

console.log('Passed: course period suggestions, multi-level/next course tuition collection, and course progress tracking.');
