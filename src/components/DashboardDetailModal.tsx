import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import { ClassRoom, CourseProgram, Room, Student, Teacher, TuitionReceipt } from '../types';

export type DashboardDetailType =
  | 'students'
  | 'teachers'
  | 'classes'
  | 'rooms'
  | 'revenue'
  | 'active'
  | 'dropped'
  | 'debt'
  | 'paid';

interface DashboardDetailModalProps {
  detail: DashboardDetailType | null;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  rooms: Room[];
  receipts: TuitionReceipt[];
  programs: CourseProgram[];
  revenueMonth: string | null;
  canViewDebt: boolean;
  onClose: () => void;
  onViewFull: (tab: string) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

const formatMonth = (value: string | null) => {
  if (!value) return 'tháng hiện tại';
  const [year, month] = value.split('-');
  return month && year ? month + '/' + year : value;
};

export const DashboardDetailModal: React.FC<DashboardDetailModalProps> = ({
  detail,
  students,
  teachers,
  classes,
  rooms,
  receipts,
  programs,
  revenueMonth,
  canViewDebt,
  onClose,
  onViewFull
}) => {
  if (!detail) return null;

  const classById = new Map<string, ClassRoom>(classes.map((item) => [item.id, item]));
  const teacherById = new Map<string, Teacher>(teachers.map((item) => [item.id, item]));
  const roomById = new Map<string, Room>(rooms.map((item) => [item.id, item]));
  const programById = new Map<string, CourseProgram>(programs.map((item) => [item.id, item]));
  const studentById = new Map<string, Student>(students.map((item) => [item.id, item]));

  const detailStudentMap: Partial<Record<DashboardDetailType, Student[]>> = {
    students,
    active: students.filter((student) => student.status === 'active'),
    dropped: students.filter((student) => student.status === 'dropped'),
    debt: students.filter((student) => student.feeStatus === 'debt'),
    paid: students.filter((student) => student.feeStatus === 'paid')
  };

  const detailStudentTitle: Partial<Record<DashboardDetailType, string>> = {
    students: 'Tất cả học sinh',
    active: 'Học sinh đang học',
    dropped: 'Học sinh nghỉ học',
    debt: 'Học sinh còn nợ học phí',
    paid: 'Học sinh đã đóng đủ'
  };

  const isStudentDetail = detail in detailStudentMap;
  const visibleStudents = detailStudentMap[detail] ?? [];
  const visibleReceipts = revenueMonth
    ? receipts.filter((receipt) => receipt.paymentDate.startsWith(revenueMonth))
    : receipts;

  const title = isStudentDetail
    ? detailStudentTitle[detail]!
    : ({
        teachers: 'Danh sách giáo viên',
        classes: 'Danh sách lớp học',
        rooms: 'Danh sách phòng học',
        revenue: 'Doanh thu tháng ' + formatMonth(revenueMonth)
      } satisfies Partial<Record<DashboardDetailType, string>>)[detail] ?? 'Chi tiết';

  const total = isStudentDetail
    ? visibleStudents.length
    : detail === 'teachers'
      ? teachers.length
      : detail === 'classes'
        ? classes.length
        : detail === 'rooms'
          ? rooms.length
          : visibleReceipts.reduce((sum, receipt) => sum + receipt.paidAmount, 0);

  const viewTab = detail === 'teachers'
    ? 'teachers'
    : detail === 'classes'
      ? 'classes'
      : detail === 'rooms'
        ? 'rooms'
        : detail === 'revenue'
          ? 'tuition'
          : 'students';

  const handleViewFull = () => {
    onClose();
    onViewFull(viewTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {detail === 'revenue'
                ? 'Tổng đã thu: ' + formatCurrency(total as number)
                : total + ' bản ghi'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 overflow-auto p-4 sm:p-6">
          {isStudentDetail && (
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Mã</th>
                  <th className="px-3 py-2.5">Học sinh</th>
                  <th className="px-3 py-2.5">Lớp</th>
                  <th className="px-3 py-2.5">Chương trình</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-3 py-2.5">Học phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.map((student) => {
                  const classRoom = classById.get(student.classId);
                  const program = programById.get(student.programId);
                  const statusLabel = student.status === 'active' ? 'Đang học' : student.status === 'dropped' ? 'Nghỉ học' : 'Bảo lưu';
                  const feeLabel = student.feeStatus === 'paid' ? 'Đã đóng đủ' : student.feeStatus === 'debt' ? 'Còn nợ' : student.feeStatus === 'partial' ? 'Đóng một phần' : 'Chưa đóng';
                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-semibold text-slate-700">{student.code}</td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{student.phone}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{classRoom?.code ?? 'Chưa xếp lớp'}</td>
                      <td className="px-3 py-3 text-slate-700">{program?.name ?? 'Chưa xác định'}</td>
                      <td className="px-3 py-3 text-slate-700">{statusLabel}</td>
                      <td className="px-3 py-3">
                        {canViewDebt || student.feeStatus === 'paid' ? feeLabel : 'Đã hạn chế'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {detail === 'teachers' && (
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr><th className="px-3 py-2.5">Giáo viên</th><th className="px-3 py-2.5">Liên hệ</th><th className="px-3 py-2.5">Chuyên môn</th><th className="px-3 py-2.5">Lớp phụ trách</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-bold text-slate-900">{teacher.name}</td>
                    <td className="px-3 py-3 text-slate-700"><div>{teacher.phone}</div><div className="mt-0.5 text-[11px] text-slate-500">{teacher.email}</div></td>
                    <td className="px-3 py-3 text-slate-700">{teacher.specialty}</td>
                    <td className="px-3 py-3 text-slate-700">{classes.filter((item) => item.teacherId === teacher.id).map((item) => item.code).join(', ') || 'Chưa phân công'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {detail === 'classes' && (
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr><th className="px-3 py-2.5">Mã lớp</th><th className="px-3 py-2.5">Lớp học</th><th className="px-3 py-2.5">Giáo viên</th><th className="px-3 py-2.5">Phòng</th><th className="px-3 py-2.5">Sĩ số</th><th className="px-3 py-2.5">Lịch học</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((classRoom) => (
                  <tr key={classRoom.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-semibold text-slate-700">{classRoom.code}</td>
                    <td className="px-3 py-3"><div className="font-bold text-slate-900">{classRoom.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{programById.get(classRoom.programId)?.name ?? 'Chưa xác định'}</div></td>
                    <td className="px-3 py-3 text-slate-700">{teacherById.get(classRoom.teacherId)?.name ?? 'Chưa phân công'}</td>
                    <td className="px-3 py-3 text-slate-700">{roomById.get(classRoom.roomId)?.name ?? 'Chưa xếp phòng'}</td>
                    <td className="px-3 py-3 font-semibold text-slate-700">{classRoom.studentIds.length}/{classRoom.capacity > 0 ? classRoom.capacity : 'Chưa cập nhật'}</td>
                    <td className="px-3 py-3 text-slate-700">{classRoom.days.join(', ')} · {classRoom.scheduleTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {detail === 'rooms' && (
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr><th className="px-3 py-2.5">Phòng</th><th className="px-3 py-2.5">Sức chứa</th><th className="px-3 py-2.5">Trạng thái</th><th className="px-3 py-2.5">Lớp đang sử dụng</th><th className="px-3 py-2.5">Ghi chú</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3"><div className="font-bold text-slate-900">{room.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{room.id}</div></td>
                    <td className="px-3 py-3 text-slate-700">{room.capacity > 0 ? `${room.capacity} chỗ` : 'Chưa cập nhật'}</td>
                    <td className="px-3 py-3 text-slate-700">{room.status === 'available' ? 'Sẵn sàng' : 'Bảo trì'}</td>
                    <td className="px-3 py-3 text-slate-700">{classes.filter((item) => item.roomId === room.id).map((item) => item.code).join(', ') || 'Trống lịch'}</td>
                    <td className="px-3 py-3 text-slate-500">{room.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {detail === 'revenue' && (
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr><th className="px-3 py-2.5">Ngày thu</th><th className="px-3 py-2.5">Phiếu thu</th><th className="px-3 py-2.5">Học sinh</th><th className="px-3 py-2.5">Hình thức</th><th className="px-3 py-2.5 text-right">Đã thu</th><th className="px-3 py-2.5 text-right">Còn nợ</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-700">{receipt.paymentDate}</td>
                    <td className="px-3 py-3 font-semibold text-slate-700">{receipt.code}</td>
                    <td className="px-3 py-3 font-bold text-slate-900">{studentById.get(receipt.studentId)?.name ?? 'Học sinh đã xóa'}</td>
                    <td className="px-3 py-3 text-slate-700">{receipt.paymentMethod}</td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-700">{formatCurrency(receipt.paidAmount)}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{canViewDebt ? formatCurrency(receipt.debtAmount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {((isStudentDetail && visibleStudents.length === 0) || (detail === 'revenue' && visibleReceipts.length === 0)) && (
            <p className="py-10 text-center text-sm text-slate-500">Chưa có dữ liệu phù hợp.</p>
          )}
        </div>

        <footer className="flex items-center justify-end border-t border-slate-100 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleViewFull}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2 text-xs font-bold text-white hover:bg-red-900"
          >
            Mở trang quản lý <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </footer>
      </section>
    </div>
  );
};
