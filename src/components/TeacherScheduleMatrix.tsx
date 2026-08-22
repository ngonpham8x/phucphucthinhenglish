import React from 'react';
import { Teacher, TimetableSlot, ClassRoom, Room } from '../types';
import { CalendarCheck, Printer, FileSpreadsheet, GraduationCap } from 'lucide-react';

interface TeacherScheduleMatrixProps {
  teachers: Teacher[];
  timetableSlots: TimetableSlot[];
  classes: ClassRoom[];
  rooms: Room[];
}

export const TeacherScheduleMatrix: React.FC<TeacherScheduleMatrixProps> = ({
  teachers,
  timetableSlots,
  classes,
  rooms
}) => {
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-red-700" />
            Bảng Lịch Giảng Dạy Giáo Viên (Excel Grid View)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trực quan hóa ca dạy của tất cả giáo viên dưới dạng Ma Trận Excel chuẩn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-400" /> In Lịch Dạy
          </button>
        </div>
      </div>

      {/* EXCEL GRID MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-4 bg-red-900 text-white flex justify-between items-center print:bg-slate-900">
          <div>
            <h3 className="font-bold text-base uppercase tracking-wider">TRUNG TÂM ANH NGỮ PHÚC PHÚC THỊNH</h3>
            <p className="text-xs text-amber-300 font-medium">BẢNG LỊCH PHÂN CÔNG GIẢNG DẠY CƠ SỞ 01</p>
          </div>
          <span className="text-xs text-red-100 italic">Cập nhật: 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-amber-500 text-slate-950 uppercase text-[11px] font-bold border-b border-amber-600">
                <th className="py-3 px-4 border-r border-amber-600 w-44">Giáo Viên</th>
                {days.map(d => (
                  <th key={d} className="py-3 px-3 border-r border-amber-600 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-medium">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 bg-slate-100 font-bold text-slate-900 border-r border-slate-300">
                    <div className="flex items-center gap-2">
                      <img src={teacher.avatar} alt={teacher.name} className="w-7 h-7 rounded-full object-cover border border-red-700" />
                      <div>
                        <div>{teacher.name}</div>
                        <div className="text-[10px] text-red-800">{teacher.specialty}</div>
                      </div>
                    </div>
                  </td>

                  {days.map((day) => {
                    const slots = timetableSlots.filter(
                      s => s.teacherId === teacher.id && s.dayOfWeek === day
                    );

                    return (
                      <td key={day} className="p-2 border-r border-slate-300 align-top h-24 min-w-[120px]">
                        {slots.length === 0 ? (
                          <div className="text-[10px] text-slate-300 text-center pt-6 italic">-</div>
                        ) : (
                          <div className="space-y-1">
                            {slots.map(s => {
                              const cls = classes.find(c => c.id === s.classId);
                              const room = rooms.find(r => r.id === s.roomId);

                              return (
                                <div
                                  key={s.id}
                                  className="p-1.5 bg-red-50 border border-red-300 rounded-lg text-[10px] shadow-2xs"
                                >
                                  <div className="font-bold text-red-900">{cls?.code} ({s.startTime})</div>
                                  <div className="text-slate-600 truncate">{cls?.name}</div>
                                  <div className="text-blue-800 font-bold">{room?.name}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
