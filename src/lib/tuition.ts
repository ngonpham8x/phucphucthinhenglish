import { FeeStatus, TuitionReceipt, CourseProgram, ClassRoom } from '../types';

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

export const COURSE_PERIOD_PRESETS = [
  'Mức độ 1 (Khóa 3 tháng)',
  'Mức độ 2 (Khóa 3 tháng)',
  'Mức độ 3 (Khóa 3 tháng)',
  'Mức độ 4 (Khóa 3 tháng)',
  'Khóa 1 (Mức độ 1)',
  'Khóa 2 (Mức độ 2)',
  'Khóa 3 (Mức độ 3)',
  'Khóa 4 (Mức độ 4)',
];

export const suggestNextCoursePeriod = (period?: string): string => {
  if (!period || !period.trim()) {
    return 'Mức độ 2 (Khóa 3 tháng)';
  }
  const trimmed = period.trim();

  // Pattern 1: 3-month date range, e.g. "Khóa 01/2026–03/2026", "01/2026 - 03/2026", "09/2026 - 11/2026"
  const dateRangeMatch = trimmed.match(/^(.*?)(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})\/(\d{4})(.*?)$/);
  if (dateRangeMatch) {
    const prefix = dateRangeMatch[1] || '';
    const startMonth = Number(dateRangeMatch[2]);
    const startYear = Number(dateRangeMatch[3]);
    const endMonth = Number(dateRangeMatch[4]);
    const endYear = Number(dateRangeMatch[5]);
    const suffix = dateRangeMatch[6] || '';

    const durationMonths = Math.max((endYear - startYear) * 12 + (endMonth - startMonth) + 1, 1);
    let nextStartMonth = endMonth + 1;
    let nextStartYear = endYear;
    while (nextStartMonth > 12) {
      nextStartMonth -= 12;
      nextStartYear += 1;
    }
    let nextEndMonth = nextStartMonth + durationMonths - 1;
    let nextEndYear = nextStartYear;
    while (nextEndMonth > 12) {
      nextEndMonth -= 12;
      nextEndYear += 1;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${prefix}${pad(nextStartMonth)}/${nextStartYear}–${pad(nextEndMonth)}/${nextEndYear}${suffix}`;
  }

  // Pattern 2: "Mức độ X" or "Level X"
  const mucDoMatch = trimmed.match(/(mức độ|muc do|level)\s*(\d+)/i);
  if (mucDoMatch) {
    const prefix = mucDoMatch[1];
    const nextNum = Number(mucDoMatch[2]) + 1;
    return trimmed.replace(new RegExp(`${prefix}\\s*${mucDoMatch[2]}`, 'i'), `${prefix} ${nextNum}`);
  }

  // Pattern 3: Year only like "Khóa 2026" or "2026"
  const yearOnlyMatch = trimmed.match(/^(?:khóa|khoa)?\s*(20\d{2})$/i);
  if (yearOnlyMatch) {
    return `${trimmed} - Mức độ 2 (Khóa 3 tháng)`;
  }

  // Pattern 4: "Khóa X", "Đợt X", "Kỳ X", "Giai đoạn X" (term number, not 4-digit year)
  const genericMatch = trimmed.match(/(khóa|khoa|đợt|dot|kỳ|ky|giai đoạn)\s*(\d+)/i);
  if (genericMatch && Number(genericMatch[2]) < 1000) {
    const prefix = genericMatch[1];
    const nextNum = Number(genericMatch[2]) + 1;
    return trimmed.replace(new RegExp(`${prefix}\\s*${genericMatch[2]}`, 'i'), `${prefix} ${nextNum}`);
  }

  // Fallback
  return `${trimmed} - Mức độ 2`;
};

export interface StudentCourseProgress {
  studentId: string;
  classId?: string;
  courseReceipts: TuitionReceipt[];
  completedPeriods: string[];
  latestReceipt?: TuitionReceipt;
  hasCompletedCourse: boolean;
  nextSuggestedPeriod: string;
  suggestedFee: number;
}

export const getStudentCourseProgress = (
  studentId: string,
  classId: string | undefined,
  receipts: TuitionReceipt[],
  programs: CourseProgram[] = [],
  classes: ClassRoom[] = []
): StudentCourseProgress => {
  const studentReceipts = receipts.filter(r =>
    r.studentId === studentId &&
    paymentKindOf(r) === 'course' &&
    (!classId || r.classId === classId)
  );

  const sorted = [...studentReceipts].sort((a, b) => (
    b.paymentDate.localeCompare(a.paymentDate) || b.code.localeCompare(a.code)
  ));
  const latestReceipt = sorted[0];
  const completedPeriods = [...new Set(
    sorted
      .filter(r => r.paidAmount > 0 && (r.debtAmount || 0) === 0)
      .map(r => r.billingPeriod?.trim())
      .filter((p): p is string => Boolean(p))
  )];

  const targetClass = classes.find(c => c.id === (classId || latestReceipt?.classId));
  const targetProgram = programs.find(p => p.id === targetClass?.programId);
  const suggestedFee = latestReceipt?.courseFee || targetProgram?.tuitionFee || 0;

  let highestPeriod = latestReceipt?.billingPeriod?.trim() || '';
  sorted.forEach(r => {
    const p = r.billingPeriod?.trim();
    if (p) {
      const m1 = p.match(/(?:mức độ|muc do|level|khóa|khoa|đợt)\s*(\d+)/i);
      const m2 = highestPeriod.match(/(?:mức độ|muc do|level|khóa|khoa|đợt)\s*(\d+)/i);
      if (m1 && (!m2 || Number(m1[1]) > Number(m2[1]))) {
        highestPeriod = p;
      }
    }
  });

  const nextSuggestedPeriod = highestPeriod
    ? suggestNextCoursePeriod(highestPeriod)
    : 'Mức độ 1 (Khóa 3 tháng)';

  return {
    studentId,
    classId,
    courseReceipts: sorted,
    completedPeriods,
    latestReceipt,
    hasCompletedCourse: completedPeriods.length > 0 || (latestReceipt ? (latestReceipt.debtAmount || 0) === 0 && latestReceipt.paidAmount > 0 : false),
    nextSuggestedPeriod,
    suggestedFee,
  };
};
