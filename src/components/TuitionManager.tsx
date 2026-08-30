import React, { useMemo, useState } from 'react';
import { TuitionReceipt, Student, ClassRoom, CourseProgram, StaffPermissions, CenterSettings } from '../types';
import { CreditCard, Plus, Printer, FileText, CheckCircle, AlertCircle, Search, X, Save, DollarSign, Edit, Trash2, Filter, RotateCcw } from 'lucide-react';
import logoImg from '../assets/images/regenerated_image_1786351687546.png';
import { paymentKindLabel, paymentMethodLabel, paymentPeriodLabel } from '../lib/tuition';

const receiptStatus = (receipt: Pick<TuitionReceipt, 'paidAmount' | 'debtAmount' | 'status'>) => {
  if (receipt.debtAmount > 0) return receipt.paidAmount > 0 ? 'partial' as const : 'debt' as const;
  return receipt.paidAmount > 0 ? 'paid' as const : 'unpaid' as const;
};

const receiptStatusLabel: Record<'paid' | 'partial' | 'unpaid' | 'debt', string> = {
  paid: 'Đã đóng đủ',
  partial: 'Đóng thiếu',
  unpaid: 'Chưa đóng',
  debt: 'Đóng thiếu',
};

const receiptStatusClass: Record<'paid' | 'partial' | 'unpaid' | 'debt', string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  unpaid: 'bg-rose-100 text-rose-800',
  debt: 'bg-rose-100 text-rose-800',
};

interface TuitionManagerProps {
  receipts: TuitionReceipt[];
  students: Student[];
  classes: ClassRoom[];
  programs: CourseProgram[];
  permissions: StaffPermissions;
  settings: CenterSettings;
  isOwner: boolean;
  onAddReceipt: (r: TuitionReceipt) => void;
  onUpdateReceipt: (r: TuitionReceipt) => void;
  onDeleteReceipt: (id: string) => void;
}

export const TuitionManager: React.FC<TuitionManagerProps> = ({
  receipts,
  students,
  classes,
  programs,
  permissions,
  settings,
  isOwner,
  onAddReceipt,
  onUpdateReceipt,
  onDeleteReceipt
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const defaultCoursePeriod = `Khóa ${new Date().getFullYear()}`;
  const [selectedReceipt, setSelectedReceipt] = useState<TuitionReceipt | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<TuitionReceipt | null>(null);
  const [pendingReceiptAction, setPendingReceiptAction] = useState<
    | { type: 'save'; receipt: TuitionReceipt; isUpdate: boolean }
    | { type: 'delete'; receipt: TuitionReceipt }
    | null
  >(null);

  const [collectingStudentId, setCollectingStudentId] = useState<string>(students[0]?.id || '');
  const [courseFeeInput, setCourseFeeInput] = useState<number>(0);
  const [monthlyFeeInput, setMonthlyFeeInput] = useState<number>(0);
  const [paymentKind, setPaymentKind] = useState<'course' | 'monthly'>('monthly');
  // A course label is invalid for <input type="month">. Retaining the two
  // values prevents the period field from appearing blank when switching kind.
  const [monthlyBillingPeriod, setMonthlyBillingPeriod] = useState<string>(currentMonth);
  const [courseBillingPeriod, setCourseBillingPeriod] = useState<string>(defaultCoursePeriod);
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tiền mặt' | 'Chuyển khoản' | 'Thẻ' | 'Chưa xác định'>('Chưa xác định');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [collectError, setCollectError] = useState<string | null>(null);
  const [receiptQuery, setReceiptQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('all');
  const [filterPaymentKind, setFilterPaymentKind] = useState<'all' | 'monthly' | 'course'>('all');
  const [filterReceiptStatus, setFilterReceiptStatus] = useState<'all' | 'paid' | 'debt'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const canCollect = isOwner || permissions.tuition.collect;
  const canDelete = isOwner || permissions.tuition.delete;

  const totalCollected = receipts.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDebt = receipts.reduce((sum, r) => sum + r.debtAmount, 0);
  const monthlyCollected = receipts.filter((receipt) => receipt.paymentKind !== 'course').reduce((sum, receipt) => sum + receipt.paidAmount, 0);
  const courseCollected = receipts.filter((receipt) => receipt.paymentKind === 'course').reduce((sum, receipt) => sum + receipt.paidAmount, 0);
  const receiptMonths: string[] = [...new Set<string>(receipts.map((receipt) => receipt.paymentDate.slice(0, 7)).filter(Boolean))].sort().reverse();
  const coursePeriodOptions = [...new Set(receipts
    .filter((receipt) => receipt.paymentKind === 'course')
    .map((receipt) => receipt.billingPeriod?.trim())
    .filter((period): period is string => Boolean(period)))];
  const filteredReceipts = useMemo(() => {
    const normalizedQuery = receiptQuery.trim().toLocaleLowerCase('vi-VN');
    return [...receipts]
      .filter((receipt) => {
        const student = students.find((item) => item.id === receipt.studentId);
        const status = receiptStatus(receipt);
        const matchesQuery = !normalizedQuery || [receipt.code, student?.code, student?.name, paymentPeriodLabel(receipt)]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase('vi-VN').includes(normalizedQuery));
        const matchesClass = filterClassId === 'all' || receipt.classId === filterClassId;
        const matchesKind = filterPaymentKind === 'all' || (filterPaymentKind === 'course' ? receipt.paymentKind === 'course' : receipt.paymentKind !== 'course');
        const matchesStatus = filterReceiptStatus === 'all' || (filterReceiptStatus === 'paid' ? status === 'paid' : receipt.debtAmount > 0);
        const matchesMethod = filterPaymentMethod === 'all' || paymentMethodLabel(receipt.paymentMethod) === filterPaymentMethod;
        const matchesMonth = filterMonth === 'all' || receipt.paymentDate.startsWith(filterMonth);
        return matchesQuery && matchesClass && matchesKind && matchesStatus && matchesMethod && matchesMonth;
      })
      .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate) || right.code.localeCompare(left.code));
  }, [filterClassId, filterMonth, filterPaymentKind, filterPaymentMethod, filterReceiptStatus, receiptQuery, receipts, students]);

  const selectedStudentReceiptHistory = useMemo(() => (
    receipts
      .filter((receipt) => receipt.studentId === collectingStudentId)
      .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate) || right.code.localeCompare(left.code))
  ), [collectingStudentId, receipts]);

  const resetReceiptFilters = () => {
    setReceiptQuery('');
    setFilterClassId('all');
    setFilterPaymentKind('all');
    setFilterReceiptStatus('all');
    setFilterPaymentMethod('all');
    setFilterMonth('all');
  };

  const showReceiptDetail = (preset: 'all' | 'debt' | 'monthly' | 'course') => {
    resetReceiptFilters();
    if (preset === 'debt') setFilterReceiptStatus('debt');
    if (preset === 'monthly' || preset === 'course') setFilterPaymentKind(preset);
  };

  const handleOpenCollect = () => {
    setEditingReceipt(null);
    setCollectingStudentId(students[0]?.id || '');
    const st = students[0];
    const program = programs.find(p => p.id === st?.programId);
    const suggestedMonthlyFee = program?.tuitionFee ?? 0;
    setCourseFeeInput(0);
    setMonthlyFeeInput(suggestedMonthlyFee);
    setPaymentKind('monthly');
    setMonthlyBillingPeriod(currentMonth);
    setCourseBillingPeriod(coursePeriodOptions[0] || defaultCoursePeriod);
    setPaidAmountInput(suggestedMonthlyFee);
    setDiscountInput(0);
    setPaymentMethod('Chưa xác định');
    setPaymentNotes('');
    setCollectError(null);
    setIsCollectModalOpen(true);
  };

  const handleOpenEditReceipt = (receipt: TuitionReceipt) => {
    setEditingReceipt(receipt);
    setCollectingStudentId(receipt.studentId);
    setCourseFeeInput(receipt.courseFee || 0);
    setMonthlyFeeInput(receipt.monthlyFee || 0);
    const receiptKind = receipt.paymentKind === 'course' ? 'course' : 'monthly';
    setPaymentKind(receiptKind);
    setMonthlyBillingPeriod(receiptKind === 'monthly'
      ? (receipt.billingPeriod || receipt.paymentDate.slice(0, 7))
      : receipt.paymentDate.slice(0, 7));
    setCourseBillingPeriod(receiptKind === 'course'
      ? (receipt.billingPeriod || defaultCoursePeriod)
      : (coursePeriodOptions[0] || defaultCoursePeriod));
    setPaidAmountInput(receipt.paidAmount);
    setDiscountInput(receipt.discount || 0);
    setPaymentMethod(receipt.paymentMethod || 'Chưa xác định');
    setPaymentNotes(receipt.notes || '');
    setCollectError(null);
    setIsCollectModalOpen(true);
  };

  const handleSaveCollect = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === collectingStudentId);
    if (!student) return;

    const selectedFee = paymentKind === 'monthly' ? monthlyFeeInput : courseFeeInput;
    const finalPrice = Math.max(selectedFee - discountInput, 0);
    const cleanBillingPeriod = (paymentKind === 'monthly' ? monthlyBillingPeriod : courseBillingPeriod).trim();
    if (selectedFee <= 0) {
      setCollectError(`Nhập học phí ${paymentKind === 'monthly' ? 'tháng' : 'khóa'} lớn hơn 0 trước khi lập phiếu.`);
      return;
    }
    if (!cleanBillingPeriod) {
      setCollectError('Nhập kỳ học phí hoặc mốc thời gian của khóa.');
      return;
    }
    if (discountInput > selectedFee) {
      setCollectError('Giảm giá không thể lớn hơn học phí.');
      return;
    }
    if (paidAmountInput > finalPrice) {
      setCollectError('Số tiền đóng không thể lớn hơn số tiền cần thu sau giảm giá.');
      return;
    }
    const debtAmount = Math.max(finalPrice - paidAmountInput, 0);
    const status = debtAmount > 0 ? (paidAmountInput > 0 ? 'partial' : 'debt') : 'paid';

    const retainContextFee = Boolean(editingReceipt);
    const nextReceipt: TuitionReceipt = {
      ...(editingReceipt ?? {}),
      id: editingReceipt?.id || `TR_${Date.now()}`,
      code: editingReceipt?.code || `PT-${new Date().getFullYear()}-${(receipts.length + 1).toString().padStart(3, '0')}`,
      studentId: student.id,
      classId: student.classId,
      // An existing receipt retains the other fee field as readable audit
      // context when the operator switches monthly <-> course. New receipts
      // keep the unused field empty so reports remain uncluttered.
      courseFee: paymentKind === 'course' || retainContextFee ? courseFeeInput : 0,
      monthlyFee: paymentKind === 'monthly' || retainContextFee ? monthlyFeeInput : 0,
      paymentKind,
      billingPeriod: cleanBillingPeriod,
      discount: discountInput,
      paidAmount: paidAmountInput,
      debtAmount,
      status,
      paymentDate: editingReceipt?.paymentDate || new Date().toISOString().split('T')[0],
      collectorName: editingReceipt?.collectorName || (isOwner ? 'Chủ trung tâm' : 'Nhân viên'),
      paymentMethod,
      notes: paymentNotes || 'Thu học phí'
    };

    setPendingReceiptAction({ type: 'save', receipt: nextReceipt, isUpdate: Boolean(editingReceipt) });
  };

  const handleConfirmReceiptAction = () => {
    if (!pendingReceiptAction) return;
    if (pendingReceiptAction.type === 'save') {
      if (pendingReceiptAction.isUpdate) onUpdateReceipt(pendingReceiptAction.receipt);
      else onAddReceipt(pendingReceiptAction.receipt);
      setIsCollectModalOpen(false);
      setEditingReceipt(null);
      setSelectedReceipt(pendingReceiptAction.receipt);
    } else {
      onDeleteReceipt(pendingReceiptAction.receipt.id);
      if (selectedReceipt?.id === pendingReceiptAction.receipt.id) setSelectedReceipt(null);
    }
    setPendingReceiptAction(null);
  };

  const handlePrintReceipt = () => {
    document.body.dataset.printing = 'tuition-receipt';
    const pageStyle = document.createElement('style');
    pageStyle.id = 'tuition-receipt-page-style';
    pageStyle.textContent = '@page { size: A5 portrait; margin: 8mm; }';
    document.head.appendChild(pageStyle);
    const cleanup = () => {
      delete document.body.dataset.printing;
      pageStyle.remove();
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-red-700" />
            Quản Lý Học Phí & Phiếu Thu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thu học phí, cấp phiếu thu, theo dõi công nợ học viên tại Cơ sở 01
          </p>
        </div>

        {canCollect && (
          <button
            onClick={handleOpenCollect}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Thu Học Phí Mới
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button type="button" onClick={() => showReceiptDetail('all')} className="bg-emerald-800 text-left text-white p-5 rounded-2xl shadow-md flex items-center justify-between transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-200">Tổng Thực Thu Học Phí</div>
            <div className="text-2xl font-extrabold mt-1">{totalCollected.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-emerald-100 mt-1">Đã cấp phiếu thu hóa đơn chính thức</div>
          </div>
          <CheckCircle className="w-10 h-10 text-emerald-300 opacity-80" />
        </button>

        <button type="button" onClick={() => showReceiptDetail('debt')} className="bg-rose-800 text-left text-white p-5 rounded-2xl shadow-md flex items-center justify-between transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">
          <div>
            <div className="text-xs uppercase font-bold text-rose-200">Tổng Công Nợ Còn Lại</div>
            <div className="text-2xl font-extrabold mt-1">{totalDebt.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-rose-100 mt-1">Bấm để xem các phiếu còn nợ</div>
          </div>
          <AlertCircle className="w-10 h-10 text-rose-300 opacity-80" />
        </button>

        <button type="button" onClick={() => showReceiptDetail('monthly')} className="bg-blue-800 text-left text-white p-5 rounded-2xl shadow-md flex items-center justify-between transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <div>
            <div className="text-xs uppercase font-bold text-blue-200">Đã thu học phí tháng</div>
            <div className="text-2xl font-extrabold mt-1">{monthlyCollected.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-blue-100 mt-1">Bấm để xem chi tiết phiếu tháng</div>
          </div>
          <DollarSign className="w-10 h-10 text-blue-300 opacity-80" />
        </button>

        <button type="button" onClick={() => showReceiptDetail('course')} className="bg-violet-800 text-left text-white p-5 rounded-2xl shadow-md flex items-center justify-between transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
          <div>
            <div className="text-xs uppercase font-bold text-violet-200">Đã thu học phí khóa</div>
            <div className="text-2xl font-extrabold mt-1">{courseCollected.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-violet-100 mt-1">Bấm để xem chi tiết phiếu khóa</div>
          </div>
          <FileText className="w-10 h-10 text-violet-300 opacity-80" />
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><Filter className="h-4 w-4 text-red-700" /> Lọc phiếu thu nhanh</h3>
          <button type="button" onClick={resetReceiptFilters} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-red-800"><RotateCcw className="h-3.5 w-3.5" /> Xóa bộ lọc</button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={receiptQuery} onChange={(event) => setReceiptQuery(event.target.value)} placeholder="Mã phiếu, mã/tên học sinh, kỳ thu..." className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100" />
          </label>
          <select value={filterClassId} onChange={(event) => setFilterClassId(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="all">Tất cả lớp</option>
            {classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.code} · {classroom.name}</option>)}
          </select>
          <select value={filterPaymentKind} onChange={(event) => setFilterPaymentKind(event.target.value as 'all' | 'monthly' | 'course')} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="all">Tất cả khoản thu</option><option value="monthly">Học phí tháng</option><option value="course">Học phí khóa</option>
          </select>
          <select value={filterReceiptStatus} onChange={(event) => setFilterReceiptStatus(event.target.value as 'all' | 'paid' | 'debt')} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="all">Tất cả tình trạng</option><option value="paid">Đã đóng đủ</option><option value="debt">Còn nợ / đóng thiếu</option>
          </select>
          <select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="all">Tất cả tháng thu</option>{receiptMonths.map((month) => <option key={month} value={month}>Tháng {month.slice(5)}/{month.slice(0, 4)}</option>)}
          </select>
          <select value={filterPaymentMethod} onChange={(event) => setFilterPaymentMethod(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="all">Tất cả hình thức</option><option value="Tiền mặt">Tiền mặt</option><option value="Chuyển khoản">Chuyển khoản</option><option value="Thẻ">Thẻ</option><option value="TM/CK">TM/CK</option>
          </select>
        </div>
      </section>

      {/* Receipts History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-800 text-slate-200 font-bold text-xs uppercase flex justify-between items-center">
          <span>Lịch Sử Phiếu Thu Học Phí ({filteredReceipts.length}/{receipts.length})</span>
          <span className="normal-case font-medium text-slate-400">Bấm vào một dòng để xem/in chi tiết</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Phiếu Thu</th>
                <th className="py-3 px-4">Học Sinh</th>
                <th className="py-3 px-4">Học Phí Khóa</th>
                <th className="py-3 px-4">Học Phí Tháng</th>
                <th className="py-3 px-4">Khoản Thu</th>
                <th className="py-3 px-4">Đã Đóng (VNĐ)</th>
                <th className="py-3 px-4">Còn Thiếu (VNĐ)</th>
                <th className="py-3 px-4">Tình Trạng</th>
                <th className="py-3 px-4">Ngày Thu</th>
                <th className="py-3 px-4">Hình Thức</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReceipts.map((rc) => {
                const student = students.find(s => s.id === rc.studentId);
                const status = receiptStatus(rc);

                return (
                  <tr key={rc.id} onClick={() => setSelectedReceipt(rc)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-red-800">{rc.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{student?.name} ({student?.code})</td>
                    <td className="py-3 px-4">{rc.courseFee > 0 ? `${rc.courseFee.toLocaleString('vi-VN')} đ` : '—'}</td>
                    <td className="py-3 px-4">{(rc.monthlyFee || 0) > 0 ? `${(rc.monthlyFee || 0).toLocaleString('vi-VN')} đ` : '—'}</td>
                    <td className="py-3 px-4"><span className="font-semibold text-slate-700">{paymentKindLabel(rc)} · {paymentPeriodLabel(rc)}</span></td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{rc.paidAmount.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 px-4 font-bold text-rose-700">
                      {rc.debtAmount > 0 ? `${rc.debtAmount.toLocaleString('vi-VN')} đ` : '—'}
                    </td>
                    <td className="py-3 px-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${receiptStatusClass[status]}`}>{receiptStatusLabel[status]}</span></td>
                    <td className="py-3 px-4">{rc.paymentDate}</td>
                    <td className="py-3 px-4">{paymentMethodLabel(rc.paymentMethod)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                      {canCollect && <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); handleOpenEditReceipt(rc); }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                        title="Sửa và cập nhật phiếu thu"
                      >
                        <Edit className="w-3.5 h-3.5" /> Sửa
                      </button>}
                      <button
                        onClick={(event) => { event.stopPropagation(); setSelectedReceipt(rc); }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-600" />
                        In Phiếu Thu
                      </button>
                      {canDelete && <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); setPendingReceiptAction({ type: 'delete', receipt: rc }); }}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                        title="Xóa phiếu thu"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredReceipts.length && <tr><td colSpan={11} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Không tìm thấy phiếu thu phù hợp với bộ lọc hiện tại.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLLECT TUITION MODAL */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-h-[90vh] max-w-md w-full overflow-y-auto p-6 shadow-xl border border-slate-200 relative custom-scrollbar">
            <button
              onClick={() => { setIsCollectModalOpen(false); setEditingReceipt(null); }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-700" />
              {editingReceipt ? `Sửa Phiếu Thu ${editingReceipt.code}` : 'Lập Phiếu Thu Học Phí'}
            </h3>

            <form onSubmit={handleSaveCollect} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn Học Sinh *</label>
                <select
                  value={collectingStudentId}
                  onChange={(e) => {
                    setCollectingStudentId(e.target.value);
                    setCollectError(null);
                    const st = students.find(s => s.id === e.target.value);
                    const prog = programs.find(p => p.id === st?.programId);
                    if (prog) {
                      if (paymentKind === 'monthly') {
                        setMonthlyFeeInput(prog.tuitionFee);
                        setPaidAmountInput(prog.tuitionFee);
                      } else {
                        setCourseFeeInput(prog.tuitionFee);
                        setPaidAmountInput(prog.tuitionFee);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  required
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code}) - Phụ huynh: {s.parentName}</option>
                  ))}
                </select>
              </div>

              {collectingStudentId && (
                <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-sky-950">Lịch sử học phí của học viên</h4>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-sky-700">{selectedStudentReceiptHistory.length} phiếu</span>
                  </div>
                  {selectedStudentReceiptHistory.length ? (
                    <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                      {selectedStudentReceiptHistory.map((receipt) => {
                        const status = receiptStatus(receipt);
                        const isCurrentReceipt = receipt.id === editingReceipt?.id;
                        return (
                          <div key={receipt.id} className={`rounded-lg border px-2.5 py-2 ${isCurrentReceipt ? 'border-amber-300 bg-amber-50' : 'border-sky-100 bg-white'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate font-bold text-slate-800">{paymentKindLabel(receipt)} · {paymentPeriodLabel(receipt)}</div>
                                <div className="text-[10px] text-slate-500">{receipt.code} · {receipt.paymentDate}{isCurrentReceipt ? ' · đang sửa' : ''}</div>
                              </div>
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${receiptStatusClass[status]}`}>{receiptStatusLabel[status]}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-semibold">
                              <span className="text-emerald-700">Đã đóng: {receipt.paidAmount.toLocaleString('vi-VN')} đ</span>
                              {receipt.debtAmount > 0 && <span className="text-rose-700">Còn nợ: {receipt.debtAmount.toLocaleString('vi-VN')} đ</span>}
                              {receipt.paymentKind === 'course' && (receipt.monthlyFee || 0) > 0 && <span className="text-slate-500">Giữ HP tháng: {(receipt.monthlyFee || 0).toLocaleString('vi-VN')} đ</span>}
                              {receipt.paymentKind !== 'course' && receipt.courseFee > 0 && <span className="text-slate-500">Giữ HP khóa: {receipt.courseFee.toLocaleString('vi-VN')} đ</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-sky-800">Chưa có phiếu thu. Sau khi lập phiếu, tháng/khóa đã đóng sẽ hiển thị ở đây.</p>
                  )}
                </section>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khoản Thu *</label>
                  <select
                    value={paymentKind}
                    onChange={(e) => {
                      const nextKind = e.target.value as 'course' | 'monthly';
                      setPaymentKind(nextKind);
                      // Keep each amount and period exactly as the operator
                      // entered it. Switching kind must not wipe the edit form.
                      setCollectError(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="course">Học phí khóa</option>
                    <option value="monthly">Học phí tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{paymentKind === 'monthly' ? 'Kỳ Học Phí' : 'Mốc Thời Gian Khóa'}</label>
                  {paymentKind === 'monthly' ? (
                    <input type="month" value={monthlyBillingPeriod} onChange={(e) => setMonthlyBillingPeriod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl" required />
                  ) : (
                    <>
                      <input type="text" value={courseBillingPeriod} onChange={(e) => setCourseBillingPeriod(e.target.value)} list="course-period-options" placeholder="Ví dụ: Khóa 09/2026–12/2026" className="w-full px-3 py-2 border border-slate-300 rounded-xl" required />
                      <datalist id="course-period-options">
                        {coursePeriodOptions.map((period) => <option key={period} value={period} />)}
                        <option value={defaultCoursePeriod} />
                      </datalist>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{paymentKind === 'course' ? 'Học Phí Khóa (VNĐ) *' : 'Học Phí Tháng (VNĐ) *'}</label>
                <input
                  type="number"
                  min="0"
                  value={paymentKind === 'course' ? courseFeeInput : monthlyFeeInput}
                  onChange={(e) => paymentKind === 'course' ? setCourseFeeInput(Number(e.target.value)) : setMonthlyFeeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>

              {editingReceipt && paymentKind === 'course' && monthlyFeeInput > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
                  <div className="font-extrabold">Học phí tháng đang được giữ lại</div>
                  <div className="mt-0.5">{monthlyFeeInput.toLocaleString('vi-VN')} đ · chuyển lại “Học phí tháng” để xem/sửa giá trị này. Lưu phiếu khóa sẽ không xóa giá trị tháng.</div>
                </div>
              )}
              {editingReceipt && paymentKind === 'monthly' && courseFeeInput > 0 && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-950">
                  <div className="font-extrabold">Học phí khóa đang được giữ lại</div>
                  <div className="mt-0.5">{courseFeeInput.toLocaleString('vi-VN')} đ · chuyển lại “Học phí khóa” để xem/sửa giá trị này. Lưu phiếu tháng sẽ không xóa giá trị khóa.</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Tiền Đóng Lần Này (VNĐ) *</label>
                  <input type="number" min="0" value={paidAmountInput} onChange={(e) => setPaidAmountInput(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-800" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giảm Giá / Miễn Giảm</label>
                  <input type="number" min="0" value={discountInput} onChange={(e) => setDiscountInput(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
              </div>

              {(() => {
                const due = Math.max((paymentKind === 'monthly' ? monthlyFeeInput : courseFeeInput) - discountInput, 0);
                const remaining = Math.max(due - paidAmountInput, 0);
                const previewStatus = paidAmountInput >= due && due > 0 ? 'paid' : (paidAmountInput > 0 ? 'partial' : 'unpaid');
                return (
                  <div className={`rounded-xl border px-3 py-2.5 ${remaining > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-700">Tình trạng phiếu</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${receiptStatusClass[previewStatus]}`}>{receiptStatusLabel[previewStatus]}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="mt-2 border-t border-amber-200 pt-2 text-amber-900">
                        <label className="mb-1 block font-semibold">Tiền còn nợ {paymentKind === 'monthly' ? 'học phí tháng' : 'học phí khóa'} (VNĐ)</label>
                        <input
                          type="number"
                          min="0"
                          max={due}
                          value={remaining}
                          onChange={(e) => {
                            const enteredDebt = Math.min(Math.max(Number(e.target.value), 0), due);
                            setPaidAmountInput(Math.max(due - enteredDebt, 0));
                          }}
                          className="w-full border border-amber-300 bg-white px-3 py-2 font-extrabold text-amber-900 rounded-xl"
                        />
                        <p className="mt-1 text-[10px] text-amber-800">Số tiền đã đóng sẽ tự điều chỉnh để khớp với số còn nợ.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {collectError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{collectError}</p>}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hình Thức Thanh Toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="Chuyển khoản">Chuyển khoản Ngân hàng</option>
                  <option value="Tiền mặt">Tiền mặt tại trung tâm</option>
                  <option value="Thẻ">Quẹt thẻ POS</option>
                  <option value="Chưa xác định">TM/CK (chưa xác định)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Thu</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="Hẹn đóng đợt 2 trước ngày..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsCollectModalOpen(false); setEditingReceipt(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-800 text-white rounded-xl font-bold hover:bg-red-900 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-amber-400" /> {editingReceipt ? 'Hoàn Thành Cập Nhật' : 'Hoàn Thành Lập Phiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingReceiptAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-label="Xác nhận thao tác phiếu thu" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">{pendingReceiptAction.type === 'delete' ? 'Xóa phiếu thu?' : pendingReceiptAction.isUpdate ? 'Hoàn thành cập nhật?' : 'Hoàn thành lập phiếu?'}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {pendingReceiptAction.type === 'delete'
                ? `Bạn có chắc muốn xóa ${pendingReceiptAction.receipt.code}? Công nợ của học viên sẽ được tính lại ngay.`
                : `${pendingReceiptAction.isUpdate ? 'Cập nhật' : 'Lưu'} ${pendingReceiptAction.receipt.code} cho ${students.find((student) => student.id === pendingReceiptAction.receipt.studentId)?.name || 'học viên'}?`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingReceiptAction(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Không</button>
              <button type="button" onClick={handleConfirmReceiptAction} className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${pendingReceiptAction.type === 'delete' ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}>Có, {pendingReceiptAction.type === 'delete' ? 'xóa' : 'hoàn thành'}</button>
            </div>
          </section>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div data-print-receipt-overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div data-print-receipt className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-slate-300 relative print:m-0 print:p-4 print:shadow-none print:border-none">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content */}
            <div className="border-2 border-red-900 p-6 rounded-xl space-y-4">
              <div className="relative border-b-2 border-red-900 pb-4 text-center">
                <img src={logoImg} onError={(event) => { event.currentTarget.src = '/phuc-phuc-thinh-logo.png'; }} alt="Logo Phúc Phúc Thịnh English" className="absolute left-2 top-0 h-14 w-14 rounded-full border border-slate-200 bg-white object-cover" />
                <div className="min-h-14 px-16">
                  <h2 className="whitespace-nowrap font-extrabold text-red-900 text-[13px] uppercase tracking-tight">{settings.name}</h2>
                  <p className="text-xs text-slate-600">{settings.address}</p>
                  <p className="text-xs text-slate-600">Hotline: {settings.phone}</p>
                  <h3 className="text-xl font-black text-slate-900 uppercase mt-3 tracking-widest">PHIẾU THU HỌC PHÍ</h3>
                  <p className="text-xs font-bold text-red-800">Số: {selectedReceipt.code}</p>
                </div>
              </div>

              {(() => {
                const student = students.find(s => s.id === selectedReceipt.studentId);
                const cls = classes.find(c => c.id === selectedReceipt.classId);

                return (
                  <div className="space-y-2 text-xs text-slate-800">
                    <div>Họ và tên học sinh: <strong className="text-sm">{student?.name}</strong> (Mã HS: {student?.code})</div>
                    <div>Phụ huynh đại diện: <strong>{student?.parentName}</strong> - SĐT: <strong>{student?.parentPhone}</strong></div>
                    <div>Lớp đăng ký học: <strong>{cls?.name}</strong></div>
                    {selectedReceipt.paymentKind === 'course'
                      ? <div>Số tiền học phí khóa: <strong>{selectedReceipt.courseFee.toLocaleString('vi-VN')} đ</strong></div>
                      : <div>Số tiền học phí tháng: <strong>{(selectedReceipt.monthlyFee || 0).toLocaleString('vi-VN')} đ</strong></div>}
                    <div>Khoản thu: <strong>{paymentKindLabel(selectedReceipt)} · {paymentPeriodLabel(selectedReceipt)}</strong></div>
                    <div>Số tiền thực đóng: <strong className="text-base text-red-800">{selectedReceipt.paidAmount.toLocaleString('vi-VN')} đ</strong></div>
                    {selectedReceipt.debtAmount > 0 && <div>Số tiền còn thiếu: <strong className="text-rose-700">{selectedReceipt.debtAmount.toLocaleString('vi-VN')} đ</strong></div>}
                    <div>Tình trạng: <strong>{receiptStatusLabel[receiptStatus(selectedReceipt)]}</strong></div>
                    <div>Hình thức thanh toán: <strong>{paymentMethodLabel(selectedReceipt.paymentMethod)}</strong></div>
                    <div>Ngày lập phiếu: <strong>{selectedReceipt.paymentDate}</strong></div>
                    <div>Ghi chú: <em>{selectedReceipt.notes || 'Đã hoàn tất thanh toán'}</em></div>
                  </div>
                );
              })()}

              <div className="pt-8 grid grid-cols-2 text-center text-xs font-bold">
                <div>
                  <p>HỌC SINH / PHỤ HUYNH</p>
                  <p className="text-[10px] text-slate-400 font-normal">(Ký & ghi rõ họ tên)</p>
                </div>
                <div>
                  <p>NGƯỜI THU TIỀN</p>
                  <p className="text-[10px] text-slate-400 font-normal">(Ký & ghi rõ họ tên)</p>
                  <p className="mt-8 text-red-900 font-bold">{selectedReceipt.collectorName}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                onClick={handlePrintReceipt}
                className="px-5 py-2 bg-red-800 text-white rounded-xl text-xs font-bold hover:bg-red-900 flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-400" /> In Phiếu Thu (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
