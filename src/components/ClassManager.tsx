import React, { useState } from 'react';
import { ClassRoom, Teacher, Room, CourseProgram, Student, StaffPermissions } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  BookOpen,
  Plus,
  Users,
  DoorOpen,
  CalendarDays,
  Clock,
  UserCheck,
  Edit,
  Trash2,
  X,
  Save,
  Eye
} from 'lucide-react';

interface ClassManagerProps {
  classes: ClassRoom[];
  teachers: Teacher[];
  rooms: Room[];
  programs: CourseProgram[];
  students: Student[];
  permissions: StaffPermissions;
  isOwner: boolean;
  onAddClass: (c: ClassRoom) => void;
  onUpdateClass: (c: ClassRoom) => void;
  onDeleteClass: (id: string) => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({
  classes,
  teachers,
  rooms,
  programs,
  students,
  permissions,
  isOwner,
  onAddClass,
  onUpdateClass,
  onDeleteClass
}) => {
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [viewingClassStudents, setViewingClassStudents] = useState<ClassRoom | null>(null);

  const canEdit = isOwner || permissions.student.edit;

  const handleOpenAdd = () => {
    setEditingClass({
      id: `CLASS${(classes.length + 1).toString().padStart(2, '0')}`,
      code: `LOP-0${classes.length + 1}`,
      name: '',
      programId: '',
      teacherId: '',
      roomId: '',
      scheduleTime: '',
      days: [],
      capacity: 0,
      studentIds: []
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.name.trim()) return;

    if (classes.some(c => c.id === editingClass.id)) {
      onUpdateClass(editingClass);
    } else {
      onAddClass(editingClass);
    }

    setIsModalOpen(false);
    setEditingClass(null);
  };

  const toggleDay = (dayStr: string) => {
    if (!editingClass) return;
    const days = editingClass.days.includes(dayStr)
      ? editingClass.days.filter(d => d !== dayStr)
      : [...editingClass.days, dayStr];
    setEditingClass({ ...editingClass, days });
  };

  const availableDays = language === 'vi'
    ? ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-700" />
            {t('class.title')} ({classes.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'vi' ? 'Danh sách các lớp học đang mở tại Cơ Sở 01 Phúc Phúc Thịnh' : 'Active class list at Phuc Phuc Thinh Campus 01'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            {t('class.add_new')}
          </button>
        )}
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const teacher = teachers.find(t => t.id === cls.teacherId);
          const room = rooms.find(r => r.id === cls.roomId);
          const program = programs.find(p => p.id === cls.programId);
          const classStudents = students.filter(s => s.classId === cls.id);
          const currentCount = classStudents.length;
          const capacityKnown = cls.capacity > 0;
          const percentFull = capacityKnown ? Math.round((currentCount / cls.capacity) * 100) : 0;

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                      {cls.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug">{cls.name}</h3>
                    <div className="text-xs text-amber-700 font-semibold mt-0.5">{program?.name}</div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingClass(cls);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Xóa lớp ${cls.name}?`)) {
                            onDeleteClass(cls.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
                    <span>{t('class.teacher')} <strong>{teacher ? teacher.name : (language === 'vi' ? 'Chưa phân công' : 'Unassigned')}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>{t('class.room')} <strong>{room ? room.name : (language === 'vi' ? 'Chưa xếp phòng' : 'Unassigned')}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>{t('class.schedule_time')} <strong>{cls.scheduleTime}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{t('class.days')} <strong>{cls.days.join(', ')}</strong></span>
                  </div>
                </div>

                {/* Sĩ số Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-slate-600">{t('class.capacity')}</span>
                    <span className="text-slate-900">{currentCount} / {capacityKnown ? cls.capacity : (language === 'vi' ? 'Chưa cập nhật' : 'Unspecified')} {t('class.students')}</span>
                  </div>
                  {capacityKnown ? <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        percentFull >= 90 ? 'bg-rose-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(percentFull, 100)}%` }}
                    />
                  </div> : <p className="text-[11px] text-amber-700">Chưa có sức chứa trong file nguồn.</p>}
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">{language === 'vi' ? 'Cơ sở 01' : 'Campus 01'}</span>
                <button
                  onClick={() => setViewingClassStudents(cls)}
                  className="text-xs font-bold text-red-800 hover:text-red-900 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> {t('class.view_roster')} ({classStudents.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW CLASS ROSTER MODAL */}
      {viewingClassStudents && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setViewingClassStudents(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Danh Sách Học Sinh: {viewingClassStudents.name} ({viewingClassStudents.code})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Lịch học: {viewingClassStudents.days.join(', ')} ({viewingClassStudents.scheduleTime})
            </p>

            <div className="divide-y divide-slate-100">
              {students.filter(s => s.classId === viewingClassStudents.id).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Lớp học này hiện chưa có học sinh nào.
                </div>
              ) : (
                students
                  .filter(s => s.classId === viewingClassStudents.id)
                  .map((st, idx) => (
                    <div key={st.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                        <img src={st.avatar} alt={st.name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-slate-900">{st.name}</div>
                          <div className="text-[10px] text-slate-500">{st.code} • Phụ huynh: {st.parentName} ({st.parentPhone})</div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        st.feeStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {st.feeStatus === 'paid' ? 'Đã đóng đủ' : 'Còn nợ'}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingClassStudents(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD CLASS MODAL */}
      {isModalOpen && editingClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingClass(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-700" />
              {classes.some(c => c.id === editingClass.id) ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Học Mới'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Lớp *</label>
                  <input
                    type="text"
                    value={editingClass.code}
                    onChange={(e) => setEditingClass({ ...editingClass, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-red-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sức Chứa Tối Đa</label>
                  <input
                    type="number"
                    value={editingClass.capacity}
                    onChange={(e) => setEditingClass({ ...editingClass, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Lớp Học *</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chương Trình Học</label>
                <select
                  value={editingClass.programId}
                  onChange={(e) => setEditingClass({ ...editingClass, programId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giáo Viên Dạy</label>
                  <select
                    value={editingClass.teacherId}
                    onChange={(e) => setEditingClass({ ...editingClass, teacherId: e.target.value })}
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
                    value={editingClass.roomId}
                    onChange={(e) => setEditingClass({ ...editingClass, roomId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ca Học</label>
                <input
                  type="text"
                  value={editingClass.scheduleTime}
                  onChange={(e) => setEditingClass({ ...editingClass, scheduleTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="18:00 - 19:30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày Học Trong Tuần</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {availableDays.map((day) => {
                    const isSelected = editingClass.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-red-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingClass(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-800 text-white rounded-xl font-bold hover:bg-red-900 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Lưu Lớp Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
