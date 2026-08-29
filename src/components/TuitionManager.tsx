import React, { useState } from 'react';
import { TuitionReceipt, Student, ClassRoom, CourseProgram, StaffPermissions, CenterSettings } from '../types';
import { CreditCard, Plus, Printer, FileText, CheckCircle, AlertCircle, Search, X, Save, DollarSign } from 'lucide-react';
import logoImg from '../assets/images/regenerated_image_1786351687546.png';
import { paymentKindLabel, paymentPeriodLabel } from '../lib/tuition';

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
}

export const TuitionManager: React.FC<TuitionManagerProps> = ({
  receipts,
  students,
  classes,
  programs,
  permissions,
  settings,
  isOwner,
  onAddReceipt
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<TuitionReceipt | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  const [collectingStudentId, setCollectingStudentId] = useState<string>(students[0]?.id || '');
  const [courseFeeInput, setCourseFeeInput] = useState<number>(0);
  const [monthlyFeeInput, setMonthlyFeeInput] = useState<number>(0);
  const [paymentKind, setPaymentKind] = useState<'course' | 'monthly'>('monthly');
  const [billingPeriod, setBillingPeriod] = useState<string>(new Date().toISOString().slice(0, 7));
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tiền mặt' | 'Chuyển khoản' | 'Thẻ' | 'Chưa xác định'>('Chuyển khoản');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [collectError, setCollectError] = useState<string | null>(null);

  const canCollect = isOwner || permissions.tuition.collect;

  const totalCollected = receipts.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDebt = receipts.reduce((sum, r) => sum + r.debtAmount, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const defaultCoursePeriod = `Khóa ${new Date().getFullYear()}`;
  const coursePeriodOptions = [...new Set(receipts
    .filter((receipt) => receipt.paymentKind === 'course')
    .map((receipt) => receipt.billingPeriod?.trim())
    .filter((period): period is string => Boolean(period)))];

  const handleOpenCollect = () => {
    setCollectingStudentId(students[0]?.id || '');
    const st = students[0];
    const program = programs.find(p => p.id === st?.programId);
    const suggestedMonthlyFee = program?.tuitionFee ?? 0;
    setCourseFeeInput(0);
    setMonthlyFeeInput(suggestedMonthlyFee);
    setPaymentKind('monthly');
    setBillingPeriod(currentMonth);
    setPaidAmountInput(suggestedMonthlyFee);
    setDiscountInput(0);
    setCollectError(null);
    setIsCollectModalOpen(true);
  };

  const handleSaveCollect = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === collectingStudentId);
    if (!student) return;

    const selectedFee = paymentKind === 'monthly' ? monthlyFeeInput : courseFeeInput;
    const finalPrice = Math.max(selectedFee - discountInput, 0);
    const cleanBillingPeriod = billingPeriod.trim();
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

    const newReceipt: TuitionReceipt = {
      id: `TR_${Date.now()}`,
      code: `PT-${new Date().getFullYear()}-${(receipts.length + 1).toString().padStart(3, '0')}`,
      studentId: student.id,
      classId: student.classId,
      courseFee: paymentKind === 'course' ? courseFeeInput : 0,
      monthlyFee: paymentKind === 'monthly' ? monthlyFeeInput : 0,
      paymentKind,
      billingPeriod: cleanBillingPeriod,
      discount: discountInput,
      paidAmount: paidAmountInput,
      debtAmount,
      status,
      paymentDate: new Date().toISOString().split('T')[0],
      collectorName: isOwner ? 'Chủ trung tâm' : 'Nhân viên',
      paymentMethod,
      notes: paymentNotes || 'Thu học phí'
    };

    onAddReceipt(newReceipt);
    setIsCollectModalOpen(false);
    setSelectedReceipt(newReceipt); // Open receipt preview for instant printing
  };

  const handlePrintReceipt = () => {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-200">Tổng Thực Thu Học Phí</div>
            <div className="text-2xl font-extrabold mt-1">{totalCollected.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-emerald-100 mt-1">Đã cấp phiếu thu hóa đơn chính thức</div>
          </div>
          <CheckCircle className="w-10 h-10 text-emerald-300 opacity-80" />
        </div>

        <div className="bg-rose-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-rose-200">Tổng Công Nợ Còn Lại</div>
            <div className="text-2xl font-extrabold mt-1">{totalDebt.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-rose-100 mt-1">Cần thu hồi từ các học sinh nợ đợt 2</div>
          </div>
          <AlertCircle className="w-10 h-10 text-rose-300 opacity-80" />
        </div>
      </div>

      {/* Receipts History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-800 text-slate-200 font-bold text-xs uppercase flex justify-between items-center">
          <span>Lịch Sử Phiếu Thu Học Phí ({receipts.length})</span>
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
                <th className="py-3 px-4 text-right">In Phiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {receipts.map((rc) => {
                const student = students.find(s => s.id === rc.studentId);
                const status = receiptStatus(rc);

                return (
                  <tr key={rc.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="py-3 px-4">{rc.paymentMethod}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(rc)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-600" />
                        In Phiếu Thu
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLLECT TUITION MODAL */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setIsCollectModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-700" />
              Lập Phiếu Thu Học Phí
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học Phí Khóa (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    value={courseFeeInput}
                    onChange={(e) => setCourseFeeInput(Number(e.target.value))}
                    disabled={paymentKind !== 'course'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học Phí Tháng (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyFeeInput}
                    onChange={(e) => setMonthlyFeeInput(Number(e.target.value))}
                    disabled={paymentKind !== 'monthly'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khoản Thu *</label>
                  <select
                    value={paymentKind}
                    onChange={(e) => {
                      const nextKind = e.target.value as 'course' | 'monthly';
                      setPaymentKind(nextKind);
                      setPaidAmountInput(nextKind === 'monthly' ? monthlyFeeInput : courseFeeInput);
                      setBillingPeriod(nextKind === 'monthly' ? currentMonth : (coursePeriodOptions[0] || defaultCoursePeriod));
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
                    <input type="month" value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl" required />
                  ) : (
                    <>
                      <input type="text" value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} list="course-period-options" placeholder="Ví dụ: Khóa 09/2026–12/2026" className="w-full px-3 py-2 border border-slate-300 rounded-xl" required />
                      <datalist id="course-period-options">
                        {coursePeriodOptions.map((period) => <option key={period} value={period} />)}
                        <option value={defaultCoursePeriod} />
                      </datalist>
                    </>
                  )}
                </div>
              </div>

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
                      <div className="mt-2 flex items-center justify-between border-t border-amber-200 pt-2 text-amber-900">
                        <span className="font-semibold">Còn thiếu {paymentKind === 'monthly' ? 'học phí tháng' : 'học phí khóa'} cần thu</span>
                        <strong>{remaining.toLocaleString('vi-VN')} đ</strong>
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
                  <option value="Chưa xác định">Chưa xác định</option>
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
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-800 text-white rounded-xl font-bold hover:bg-red-900 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Xác Nhận Thu & In Phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-slate-300 relative print:m-0 print:p-4 print:shadow-none print:border-none">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content */}
            <div className="border-2 border-red-900 p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-center gap-3 border-b-2 border-red-900 pb-4 text-center">
                <img src={logoImg} onError={(event) => { event.currentTarget.src = '/phuc-phuc-thinh-logo.png'; }} alt="Logo Phúc Phúc Thịnh English" className="h-14 w-14 rounded-full border border-slate-200 bg-white object-cover" />
                <div>
                  <h2 className="font-extrabold text-red-900 text-lg uppercase tracking-wider">{settings.name}</h2>
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
                    <div>Hình thức thanh toán: <strong>{selectedReceipt.paymentMethod}</strong></div>
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
