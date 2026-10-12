import { FeeStatus, TuitionReceipt } from '../types';

export type TuitionPaymentKind = 'course' | 'monthly';

export const paymentKindOf = (receipt: Pick<TuitionReceipt, 'paymentKind'>): TuitionPaymentKind => (
  receipt.paymentKind === 'course' ? 'course' : 'monthly'
);

export const paymentKindLabel = (receipt: Pick<TuitionReceipt, 'paymentKind'>) => (
  paymentKindOf(receipt) === 'course' ? 'Học phí khóa' : 'Học phí tháng'
);

// "Chưa xác định" is an internal value. Documents should display the
// conventional cash/bank-transfer placeholder instead of an unfinished state.
export const paymentMethodLabel = (method?: TuitionReceipt['paymentMethod']) => (
  !method || method === 'Chưa xác định' ? 'TM/CK' : method
);

export const paymentPeriodLabel = (receipt: Pick<TuitionReceipt, 'paymentKind' | 'billingPeriod' | 'paymentDate'>) => {
  const period = receipt.billingPeriod?.trim();
  if (paymentKindOf(receipt) === 'monthly' && period && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    return `Tháng ${month}/${year}`;
  }
  return period || (paymentKindOf(receipt) === 'monthly' ? `Tháng ${receipt.paymentDate.slice(5, 7)}/${receipt.paymentDate.slice(0, 4)}` : 'Chưa ghi mốc khóa');
};

export interface TuitionDebtBreakdown {
  total: number;
  monthly: number;
  course: number;
}

export const debtBreakdown = (receipts: TuitionReceipt[]): TuitionDebtBreakdown => {
  // Balances are reconciled against the complete ledger when it changes.
  // Summing stored balances keeps month/class filters from recreating debt
  // by dropping earlier installments from the calculation.
  const monthly = receipts.filter(r => paymentKindOf(r) === 'monthly')
    .reduce((sum, r) => sum + Math.max(r.debtAmount || 0, 0), 0);
  const course = receipts.filter(r => paymentKindOf(r) === 'course')
    .reduce((sum, r) => sum + Math.max(r.debtAmount || 0, 0), 0);
  return { total: monthly + course, monthly, course };
};

export const feeStatusForReceipts = (receipts: TuitionReceipt[]): FeeStatus => {
  const debt = debtBreakdown(receipts).total;
  const paid = receipts.reduce((sum, receipt) => sum + Math.max(receipt.paidAmount || 0, 0), 0);
  if (debt > 0) return paid > 0 ? 'partial' : 'debt';
  return paid > 0 ? 'paid' : 'unpaid';
};

// Recompute outstanding balances after every change, including deleting a final
// installment. Historical amounts and collection dates remain unchanged.
export const reconcileReceiptBalances = (receipts: TuitionReceipt[]): TuitionReceipt[] => {
  const groups = new Map<string, TuitionReceipt[]>();
  receipts.forEach(receipt => {
    const period = (receipt.billingPeriod || receipt.paymentDate.slice(0, 7)).trim().toLowerCase();
    const key = JSON.stringify([receipt.studentId, receipt.classId, paymentKindOf(receipt), period]);
    const group = groups.get(key) || [];
    group.push(receipt);
    groups.set(key, group);
  });
  const balances = new Map<string, number>();
  groups.forEach(group => {
    const fee = Math.max(...group.map(r => paymentKindOf(r) === 'course' ? r.courseFee || 0 : r.monthlyFee || 0));
    if (fee <= 0) return;
    const due = Math.max(fee - Math.max(...group.map(r => r.discount || 0)), 0);
    const paid = group.reduce((sum, r) => sum + Math.max(r.paidAmount || 0, 0), 0);
    const latest = [...group].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.id.localeCompare(a.id))[0];
    group.forEach(r => balances.set(r.id, r.id === latest.id ? Math.max(due - paid, 0) : 0));
  });
  return receipts.map(receipt => {
    const debtAmount = balances.get(receipt.id) ?? receipt.debtAmount;
    const status: FeeStatus = debtAmount > 0 ? (receipt.paidAmount > 0 ? 'partial' : 'debt') : (receipt.paidAmount > 0 ? 'paid' : 'unpaid');
    return { ...receipt, debtAmount, status };
  });
};

export const nextReceiptCode = (receipts: Pick<TuitionReceipt, 'code'>[], year: number): string => {
  const prefix = `PT-${year}-`;
  const highest = receipts.reduce((max, receipt) => {
    const suffix = receipt.code.startsWith(prefix) ? receipt.code.slice(prefix.length) : '';
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
};
