import assert from 'node:assert/strict';
import { debtBreakdown, feeStatusForReceipts, reconcileReceiptBalances, nextReceiptCode } from '../src/lib/tuition';
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
