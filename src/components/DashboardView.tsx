import React, { useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Building2, CheckCircle2, DollarSign, GraduationCap, Users, UserCheck, UserMinus } from 'lucide-react';
import { ClassRoom, CourseProgram, Room, Student, Teacher, TuitionReceipt, UserAccount } from '../types';
import { DashboardDetailModal, DashboardDetailType } from './DashboardDetailModal';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  rooms: Room[];
  receipts: TuitionReceipt[];
  programs: CourseProgram[];
  currentUser: UserAccount;
  onNavigateTab: (tab: string) => void;
}

const COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
const currency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const monthLabel = (month: string) => month ? `Tháng ${month.slice(5)}/${month.slice(0, 4)}` : 'Chưa có kỳ thu';

export const DashboardView: React.FC<DashboardViewProps> = ({ students, teachers, classes, rooms, receipts, programs, currentUser, onNavigateTab }) => {
  const [selectedDetail, setSelectedDetail] = useState<DashboardDetailType | null>(null);
  const isOwner = currentUser.role === 'owner';
  const canViewStudents = isOwner || currentUser.permissions.student.view;
  const canViewTeachers = isOwner || currentUser.permissions.teacher.view;
  const canViewClasses = canViewStudents || canViewTeachers;
  const canViewRooms = canViewClasses;
  const canViewTuition = isOwner || currentUser.permissions.tuition.view;
  const showRevenue = isOwner || (currentUser.permissions.report?.view && currentUser.permissions.report?.revenue);
  const showDebt = isOwner || (canViewTuition && currentUser.permissions.tuition.showDebt);
  const activeStudents = students.filter((student) => student.status === 'active');
  const reservedStudents = students.filter((student) => student.status === 'reserved');
  const droppedStudents = students.filter((student) => student.status === 'dropped');
  const paidStudents = students.filter((student) => student.feeStatus === 'paid');
  const debtStudents = students.filter((student) => student.feeStatus === 'debt' || student.feeStatus === 'unpaid');
  const totalCollected = receipts.reduce((sum, receipt) => sum + receipt.paidAmount, 0);
  const totalDebt = receipts.reduce((sum, receipt) => sum + receipt.debtAmount, 0);
  const latestReceiptMonth = receipts.map((receipt) => receipt.paymentDate.slice(0, 7)).filter(Boolean).sort().at(-1) || '';
  const monthlyRevenue = receipts.filter((receipt) => receipt.paymentDate.startsWith(latestReceiptMonth)).reduce((sum, receipt) => sum + receipt.paidAmount, 0);
  const classById = new Map(classes.map((classroom) => [classroom.id, classroom]));
  const programById = new Map(programs.map((program) => [program.id, program]));

  const receiptMonths = receipts.map((receipt) => receipt.paymentDate.slice(0, 7)).filter((month): month is string => Boolean(month));
  const monthlyRevenueData = (showRevenue ? [...new Set<string>(receiptMonths)] : [])
    .sort()
    .map((month) => ({ month: monthLabel(month), amount: receipts.filter((receipt) => receipt.paymentDate.startsWith(month)).reduce((sum, receipt) => sum + receipt.paidAmount, 0) }));
  const programData = (canViewStudents ? programs : []).map((program, index) => ({
    name: program.name,
    value: students.filter((student) => student.programId === program.id).length,
    color: COLORS[index % COLORS.length]
  })).filter((item) => item.value > 0);
  const tuitionStatusData = (showDebt ? [
    { name: 'Đã đóng đủ', value: paidStudents.length, color: '#059669' },
    { name: 'Còn nợ / chưa đóng', value: debtStudents.length, color: '#dc2626' },
    { name: 'Bảo lưu', value: reservedStudents.length, color: '#d97706' }
  ] : []).filter((item) => item.value > 0);
  const classMonthlyData = (showRevenue ? classes : []).map((classroom) => ({
    classroom,
    collected: receipts.filter((receipt) => receipt.classId === classroom.id && receipt.paymentDate.startsWith(latestReceiptMonth)).reduce((sum, receipt) => sum + receipt.paidAmount, 0),
    debt: receipts.filter((receipt) => receipt.classId === classroom.id).reduce((sum, receipt) => sum + receipt.debtAmount, 0)
  })).sort((a, b) => b.collected - a.collected || b.debt - a.debt);
  const studentRows = (canViewStudents ? students : []).slice(0, 8).map((student) => ({
    ...student,
    classroom: classById.get(student.classId),
    program: programById.get(student.programId),
    debt: receipts.filter((receipt) => receipt.studentId === student.id).reduce((sum, receipt) => sum + receipt.debtAmount, 0)
  }));

  const Card = ({ label, value, icon: Icon, color, detail, subtitle }: { label: string; value: string | number; icon: React.ElementType; color: string; detail: DashboardDetailType; subtitle?: string }) => {
    const canOpen = detail === 'students' || detail === 'active' || detail === 'dropped'
      ? canViewStudents
      : detail === 'teachers'
        ? canViewTeachers
        : detail === 'classes'
          ? canViewClasses
          : detail === 'rooms'
            ? canViewRooms
            : detail === 'revenue' || detail === 'debt' || detail === 'paid'
              ? showRevenue || showDebt
              : false;
    const content = <div className="flex items-center justify-between gap-3">
      <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold text-slate-900">{canOpen ? value : '—'}</p>{canOpen && subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}</div>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
    </div>;
    const className = 'w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs';
    return canOpen
      ? <button onClick={() => setSelectedDetail(detail)} className={`${className} transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600`}>{content}</button>
      : <div className={className}>{content}</div>;
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card label="Tổng học sinh" value={students.length} icon={Users} color="bg-red-100 text-red-600" detail="students" subtitle={`${activeStudents.length} đang học`} />
        <Card label="Tổng giáo viên" value={teachers.length} icon={GraduationCap} color="bg-blue-100 text-blue-600" detail="teachers" />
        <Card label="Tổng lớp" value={classes.length} icon={Building2} color="bg-amber-100 text-amber-600" detail="classes" />
        <Card label="Tổng phòng" value={rooms.length} icon={Building2} color="bg-emerald-100 text-emerald-600" detail="rooms" />
        {showRevenue ? <Card label={`Doanh thu ${monthLabel(latestReceiptMonth).toLocaleLowerCase('vi-VN')}`} value={currency(monthlyRevenue)} icon={DollarSign} color="bg-purple-100 text-purple-600" detail="revenue" subtitle="Từ các phiếu thu đã nhập" /> : <Card label="Học sinh còn nợ" value={showDebt ? debtStudents.length : '—'} icon={AlertTriangle} color="bg-amber-100 text-amber-600" detail="debt" />}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Đang học" value={activeStudents.length} icon={UserCheck} color="bg-emerald-100 text-emerald-600" detail="active" />
        <Card label="Bảo lưu" value={reservedStudents.length} icon={UserMinus} color="bg-amber-100 text-amber-600" detail="dropped" />
        <Card label="Còn nợ học phí" value={showDebt ? debtStudents.length : '—'} icon={AlertTriangle} color="bg-orange-100 text-orange-600" detail="debt" />
        <Card label="Đã đóng đủ" value={paidStudents.length} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" detail="paid" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"><h2 className="text-sm font-bold text-slate-800">Học sinh theo chương trình</h2><div className="mt-3 flex items-center gap-3"><div className="h-36 w-36"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={programData} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2}>{programData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div><div className="min-w-0 flex-1 space-y-2">{programData.map((item) => <div key={item.name} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-1.5 text-slate-600"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /> <span className="truncate">{item.name}</span></span><b>{item.value}</b></div>)}</div></div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"><h2 className="text-sm font-bold text-slate-800">Doanh thu theo tháng</h2><div className="mt-3 h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyRevenueData}><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${Math.round(value / 1000000)}M`} /><Tooltip formatter={(value) => [currency(Number(value)), 'Đã thu']} /><Bar dataKey="amount" fill="#dc2626" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"><h2 className="text-sm font-bold text-slate-800">Tình trạng học phí</h2><div className="mt-3 flex items-center gap-3"><div className="h-36 w-36"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={tuitionStatusData} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2}>{tuitionStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div><div className="min-w-0 flex-1 space-y-2">{tuitionStatusData.map((item) => <div key={item.name} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-1.5 text-slate-600"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /> <span className="truncate">{item.name}</span></span><b>{item.value}</b></div>)}</div></div></div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="text-sm font-bold text-slate-800">Tổng thu từng lớp — {monthLabel(latestReceiptMonth)}</h2><p className="mt-1 text-[11px] text-slate-500">Tính trực tiếp từ ngày thu trên phiếu.</p></div><button onClick={() => onNavigateTab('tuition')} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800">Quản lý học phí</button></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Lớp</th><th className="px-4 py-3 text-right">Đã thu</th>{showDebt && <th className="px-4 py-3 text-right">Công nợ</th>}</tr></thead><tbody className="divide-y divide-slate-100">{classMonthlyData.map(({ classroom, collected, debt }) => <tr key={classroom.id}><td className="px-4 py-3"><b className="text-slate-900">{classroom.code}</b><span className="ml-2 text-slate-500">{classroom.name}</span></td><td className="px-4 py-3 text-right font-bold text-emerald-700">{currency(collected)}</td>{showDebt && <td className="px-4 py-3 text-right font-bold text-rose-700">{currency(debt)}</td>}</tr>)}</tbody></table></div></div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="text-sm font-bold text-slate-800">Danh sách học sinh</h2><p className="mt-1 text-[11px] text-slate-500">Dữ liệu từ file đã chuẩn hoá.</p></div><button onClick={() => onNavigateTab('students')} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800">Xem tất cả</button></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Mã</th><th className="px-4 py-3">Học sinh</th><th className="px-4 py-3">Lớp</th>{showDebt && <th className="px-4 py-3 text-right">Nợ</th>}</tr></thead><tbody className="divide-y divide-slate-100">{studentRows.map((student) => <tr key={student.id}><td className="px-4 py-3 font-bold text-slate-700">{student.code}</td><td className="px-4 py-3"><b className="text-slate-900">{student.name}</b><span className="mt-0.5 block text-[11px] text-slate-500">{student.status === 'reserved' ? 'Bảo lưu' : 'Đang học'}</span></td><td className="px-4 py-3 text-slate-600">{student.classroom?.code || 'Chưa xếp'}</td>{showDebt && <td className="px-4 py-3 text-right font-bold text-rose-700">{currency(student.debt)}</td>}</tr>)}</tbody></table></div></div>
      </section>

      {showDebt && <section className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Tổng phải thu</p><p className="mt-1 text-xl font-extrabold">{currency(totalCollected + totalDebt)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Đã thu</p><p className="mt-1 text-xl font-extrabold text-emerald-700">{currency(totalCollected)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Công nợ</p><p className="mt-1 text-xl font-extrabold text-rose-700">{currency(totalDebt)}</p></div></section>}

      <DashboardDetailModal detail={selectedDetail} students={students} teachers={teachers} classes={classes} rooms={rooms} receipts={receipts} programs={programs} revenueMonth={latestReceiptMonth || null} canViewDebt={showDebt} onClose={() => setSelectedDetail(null)} onViewFull={onNavigateTab} />
    </div>
  );
};
