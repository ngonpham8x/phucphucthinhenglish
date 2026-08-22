import React, { useState } from 'react';
import { Student, Teacher, ClassRoom, TuitionReceipt } from '../types';
import { BarChart3, Calendar, Download, Printer, DollarSign, Users, BookOpen } from 'lucide-react';

interface ReportViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  receipts: TuitionReceipt[];
}

export const ReportView: React.FC<ReportViewProps> = ({
  students,
  teachers,
  classes,
  receipts
}) => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('month');

  const totalRevenue = receipts.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDebt = receipts.reduce((sum, r) => sum + r.debtAmount, 0);
  const activeCount = students.filter(s => s.status === 'active').length;
  const reservedCount = students.filter(s => s.status === 'reserved').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-700" />
            Báo Cáo Tổng Hợp Trung Tâm Anh Ngữ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem báo cáo theo Ngày, Tuần, Tháng về Học sinh, Doanh thu học phí & Hoạt động lớp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setTimeFilter('day')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${timeFilter === 'day' ? 'bg-red-800 text-white' : 'text-slate-600'}`}
            >
              Hằng Ngày
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${timeFilter === 'week' ? 'bg-red-800 text-white' : 'text-slate-600'}`}
            >
              Hằng Tuần
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${timeFilter === 'month' ? 'bg-red-800 text-white' : 'text-slate-600'}`}
            >
              Hằng Tháng
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" /> In Báo Cáo
          </button>
        </div>
      </div>

      {/* Report Paper */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="text-center border-b border-slate-200 pb-4">
          <h1 className="font-extrabold text-xl text-red-900 uppercase tracking-wider">TRUNG TÂM ANH NGỮ PHÚC PHÚC THỊNH</h1>
          <p className="text-xs text-slate-500">Cơ sở 01: Số 123 Đường Nguyễn Huệ, Phường 1, TP. Tây Ninh</p>
          <h2 className="text-lg font-bold text-slate-800 uppercase mt-2">
            BÁO CÁO TỔNG HỢP {timeFilter === 'day' ? 'HẰNG NGÀY' : (timeFilter === 'week' ? 'HẰNG TUẦN' : 'HẰNG THÁNG')}
          </h2>
          <p className="text-xs text-slate-400 italic">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        {/* 4 Summary Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 font-semibold uppercase">Tổng Học Sinh</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{students.length} HS</div>
            <div className="text-[11px] text-emerald-700 font-medium">{activeCount} đang học • {reservedCount} bảo lưu</div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 font-semibold uppercase">Tổng Doanh Thu</div>
            <div className="text-xl font-bold text-amber-700 mt-1">{totalRevenue.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-slate-500">Đã thu thực tế</div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 font-semibold uppercase">Tổng Công Nợ</div>
            <div className="text-xl font-bold text-rose-700 mt-1">{totalDebt.toLocaleString('vi-VN')} đ</div>
            <div className="text-[11px] text-rose-600 font-medium">Cần đôn đốc thu</div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 font-semibold uppercase">Số Lớp Đang Mở</div>
            <div className="text-xl font-bold text-blue-700 mt-1">{classes.length} Lớp</div>
            <div className="text-[11px] text-slate-500">{teachers.length} giáo viên phụ trách</div>
          </div>
        </div>

        {/* Classes Table */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-3">Chi Tiết Tình Hình Lớp Học & Học Phí:</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-800 text-slate-200 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5">STT</th>
                  <th className="p-2.5">Mã Lớp</th>
                  <th className="p-2.5">Tên Lớp Học</th>
                  <th className="p-2.5">Sĩ Số</th>
                  <th className="p-2.5">Doanh Thu Thu</th>
                  <th className="p-2.5">Còn Nợ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {classes.map((cls, idx) => {
                  const classStudents = students.filter(s => s.classId === cls.id);
                  const classReceipts = receipts.filter(r => classStudents.some(st => st.id === r.studentId));
                  const paid = classReceipts.reduce((s, r) => s + r.paidAmount, 0);
                  const debt = classReceipts.reduce((s, r) => s + r.debtAmount, 0);

                  return (
                    <tr key={cls.id}>
                      <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-red-800">{cls.code}</td>
                      <td className="p-2.5 font-bold text-slate-900">{cls.name}</td>
                      <td className="p-2.5">{classStudents.length} / {cls.capacity > 0 ? cls.capacity : 'Chưa cập nhật'} HS</td>
                      <td className="p-2.5 font-bold text-emerald-700">{paid.toLocaleString('vi-VN')} đ</td>
                      <td className="p-2.5 font-bold text-rose-700">{debt.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
