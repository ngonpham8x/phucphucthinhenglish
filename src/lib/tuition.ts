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

export const debtBreakdown = (receipts: TuitionReceipt[]): TuitionDebtBreakdown => receipts.reduce<TuitionDebtBreakdown>((summary, receipt) => {
  const debt = Math.max(receipt.debtAmount || 0, 0);
  if (!debt) return summary;
  summary.total += debt;
  if (paymentKindOf(receipt) === 'course') summary.course += debt;
  else summary.monthly += debt;
  return summary;
}, { total: 0, monthly: 0, course: 0 });

export const feeStatusForReceipts = (receipts: TuitionReceipt[]): FeeStatus => {
  const debt = debtBreakdown(receipts).total;
  const paid = receipts.reduce((sum, receipt) => sum + Math.max(receipt.paidAmount || 0, 0), 0);
  if (debt > 0) return paid > 0 ? 'partial' : 'debt';
  return paid > 0 ? 'paid' : 'unpaid';
};
