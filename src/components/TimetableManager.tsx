import React, { useState } from 'react';
import { TimetableSlot, ClassRoom, Teacher, Room } from '../types';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
  UserCheck,
  DoorOpen,
  BookOpen
} from 'lucide-react';

interface TimetableManagerProps {
  timetableSlots: TimetableSlot[];
  classes: ClassRoom[];
  teachers: Teacher[];
  rooms: Room[];
  onAddSlot: (slot: TimetableSlot) => void;
  onUpdateSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (id: string) => void;
}

export const TimetableManager: React.FC<TimetableManagerProps> = ({
  timetableSlots,
  classes,
  teachers,
  rooms,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<string>('Thứ 2');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const timeSlots = ['17:30 - 19:00', '18:00 - 19:30', '19:30 - 21:00'];

  // Conflict Detection Engine
  const checkConflict = (targetSlot: TimetableSlot): string | null => {
    const existing = timetableSlots.filter(s => s.id !== targetSlot.id);

    for (const slot of existing) {
      if (slot.dayOfWeek === targetSlot.dayOfWeek) {
        // Time overlap check
        const isTimeOverlap =
          (targetSlot.startTime >= slot.startTime && targetSlot.startTime < slot.endTime) ||
          (targetSlot.endTime > slot.startTime && targetSlot.endTime <= slot.endTime) ||
          (targetSlot.startTime <= slot.startTime && targetSlot.endTime >= slot.endTime);

        if (isTimeOverlap) {
          if (slot.teacherId === targetSlot.teacherId) {
            const gv = teachers.find(t => t.id === targetSlot.teacherId)?.name;
            return `Trùng giáo viên (${gv}) vào ${targetSlot.dayOfWeek} (${targetSlot.startTime}-${targetSlot.endTime})`;
          }
          if (slot.roomId === targetSlot.roomId) {
            const p = rooms.find(r => r.id === targetSlot.roomId)?.name;
            return `Trùng phòng học (${p}) vào ${targetSlot.dayOfWeek} (${targetSlot.startTime}-${targetSlot.endTime})`;
          }
          if (slot.classId === targetSlot.classId) {
            const c = classes.find(cl => cl.id === targetSlot.classId)?.name;
            return `Trùng lớp học (${c}) vào ${targetSlot.dayOfWeek} (${targetSlot.startTime}-${targetSlot.endTime})`;
          }
        }
      }
    }
    return null;
  };

  const handleOpenAdd = () => {
    const defaultClass = classes[0];
    setEditingSlot({
      id: `TT_${Date.now()}`,
      classId: defaultClass?.id || '',
      teacherId: defaultClass?.teacherId || teachers[0]?.id || '',
      roomId: defaultClass?.roomId || rooms[0]?.id || '',
      dayOfWeek: selectedDay,
      startTime: '18:00',
      endTime: '19:30'
    });
    setConflictError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    const conflict = checkConflict(editingSlot);
    if (conflict) {
      setConflictError(conflict);
      return;
    }

    if (timetableSlots.some(s => s.id === editingSlot.id)) {
      onUpdateSlot(editingSlot);
    } else {
      onAddSlot(editingSlot);
    }

    setIsModalOpen(false);
    setEditingSlot(null);
    setConflictError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-red-700" />
            Thời Khóa Biểu Trung Tâm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hệ thống tự động kiểm tra chống trùng lịch Giáo viên, Phòng học & Lớp học
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'week' ? 'bg-red-800 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Xem Theo Tuần
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'day' ? 'bg-red-800 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Xem Theo Ngày
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Tạo Ca Học
          </button>
        </div>
      </div>

      {/* Day Selector (for Day View) */}
      {viewMode === 'day' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDay === day
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* TIMETABLE GRID TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-800 text-slate-200 uppercase text-[11px] font-bold">
              <tr>
                <th className="py-3 px-4 border-b border-slate-700 w-32">Ca Học / Giờ</th>
                {(viewMode === 'week' ? daysOfWeek : [selectedDay]).map((day) => (
                  <th key={day} className="py-3 px-4 border-b border-slate-700 text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {timeSlots.map((timeRange) => {
                const [start, end] = timeRange.split(' - ');

                return (
                  <tr key={timeRange} className="hover:bg-slate-50">
                    <td className="py-4 px-4 bg-slate-50 font-bold text-red-900 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {timeRange}
                      </div>
                    </td>

                    {(viewMode === 'week' ? daysOfWeek : [selectedDay]).map((day) => {
                      const matchedSlots = timetableSlots.filter(
                        s => s.dayOfWeek === day && s.startTime === start
                      );

                      return (
                        <td key={day} className="p-2 border-r border-slate-100 align-top h-28">
                          {matchedSlots.length === 0 ? (
                            <div className="h-full border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-300">
                              Trống ca
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {matchedSlots.map((slot) => {
                                const cls = classes.find(c => c.id === slot.classId);
                                const teacher = teachers.find(t => t.id === slot.teacherId);
                                const room = rooms.find(r => r.id === slot.roomId);

                                return (
                                  <div
                                    key={slot.id}
                                    className="p-2 bg-gradient-to-br from-red-50 to-amber-50/50 border border-red-200 rounded-xl shadow-2xs relative group text-[11px]"
                                  >
                                    <div className="font-bold text-red-900 flex items-center justify-between">
                                      <span className="truncate">{cls?.name || 'Lớp học'}</span>
                                      <button
                                        onClick={() => onDeleteSlot(slot.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                                        title="Xóa ca"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="text-[10px] text-slate-700 mt-1 space-y-0.5">
                                      <div className="flex items-center gap-1">
                                        <UserCheck className="w-3 h-3 text-red-700" /> {teacher?.name}
                                      </div>
                                      <div className="flex items-center gap-1 font-semibold text-blue-800">
                                        <DoorOpen className="w-3 h-3 text-blue-600" /> {room?.name}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SLOT MODAL WITH CONFLICT CHECKER */}
      {isModalOpen && editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingSlot(null);
                setConflictError(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-red-700" />
              Tạo Lịch Học Mới
            </h3>

            {conflictError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lớp Học *</label>
                <select
                  value={editingSlot.classId}
                  onChange={(e) => {
                    const selectedCls = classes.find(c => c.id === e.target.value);
                    setEditingSlot({
                      ...editingSlot,
                      classId: e.target.value,
                      teacherId: selectedCls?.teacherId || editingSlot.teacherId,
                      roomId: selectedCls?.roomId || editingSlot.roomId
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giáo Viên Dạy</label>
                  <select
                    value={editingSlot.teacherId}
                    onChange={(e) => setEditingSlot({ ...editingSlot, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng Học</label>
                  <select
                    value={editingSlot.roomId}
                    onChange={(e) => setEditingSlot({ ...editingSlot, roomId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thứ Trong Tuần</label>
                  <select
                    value={editingSlot.dayOfWeek}
                    onChange={(e) => setEditingSlot({ ...editingSlot, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {daysOfWeek.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ Bắt Đầu</label>
                  <select
                    value={editingSlot.startTime}
                    onChange={(e) => {
                      const start = e.target.value;
                      const end = start === '17:30' ? '19:00' : (start === '18:00' ? '19:30' : '21:00');
                      setEditingSlot({ ...editingSlot, startTime: start, endTime: end });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="17:30">17:30</option>
                    <option value="18:00">18:00</option>
                    <option value="19:30">19:30</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSlot(null);
                    setConflictError(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-800 text-white rounded-xl font-bold hover:bg-red-900 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Lưu Ca Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
