import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Student,
  CourseProgram,
  ClassRoom,
  Teacher,
  Room,
  StaffPermissions,
  StudentStatus,
  FeeStatus
} from '../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin,
  Calendar,
  School,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  User,
  X,
  Save,
  UserPlus,
  LayoutGrid,
  Table as TableIcon,
  DoorOpen,
  GraduationCap,
  BookOpen,
  CalendarDays,
  DollarSign,
  UserCheck
} from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  programs: CourseProgram[];
  classes: ClassRoom[];
  teachers?: Teacher[];
  rooms?: Room[];
  permissions: StaffPermissions;
  isOwner: boolean;
  searchQuery: string;
  onAddStudent: (newStudent: Student) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (id: string) => void;
  onOpenImportExportModal: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  programs,
  classes,
  teachers = [],
  rooms = [],
  permissions,
  isOwner,
  searchQuery,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onOpenImportExportModal
}) => {
  const { t, language } = useLanguage();
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const canAdd = isOwner || permissions.student.add;
  const canEdit = isOwner || permissions.student.edit;
  const canDelete = isOwner || permissions.student.delete;
  // Báo cáo workbook có cả dữ liệu học phí, nên chỉ quyền Excel mới được mở.
  const canExport = isOwner || permissions.excel.import || permissions.excel.export;

  // Filtered list
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentPhone.includes(searchQuery);

    const matchesProgram = filterProgram === 'all' || s.programId === filterProgram;
    const matchesClass = filterClass === 'all' || s.classId === filterClass;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchesSearch && matchesProgram && matchesClass && matchesStatus;
  });

  // Empty new student form builder
  const handleOpenAddModal = () => {
    const nextCodeNum = students.length + 1;
    const autoCode = `HS${nextCodeNum.toString().padStart(3, '0')}`;
    setEditingStudent({
      id: `HS_NEW_${Date.now()}`,
      code: autoCode,
      name: '',
      dob: '',
      gender: 'Chưa xác định',
      school: '',
      gradeLevel: '',
      programId: '',
      classId: '',
      address: '',
      email: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      enrollDate: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'active',
      feeStatus: 'unpaid'
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editingStudent.name.trim()) {
      alert('Vui lòng nhập họ và tên học sinh');
      return;
    }

    const existing = students.find(s => s.id === editingStudent.id);
    if (existing) {
      onUpdateStudent(editingStudent);
    } else {
      onAddStudent(editingStudent);
    }

    setIsModalOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-red-700" />
            Quản Lý Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hiển thị {filteredStudents.length} / {students.length} học sinh toàn trung tâm
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canExport ? (
            <button
              onClick={onOpenImportExportModal}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Excel Import / Export
            </button>
          ) : (
            <button
              disabled
              title={language === 'vi' ? "Cần Chủ cơ sở cấp quyền 'Tải / Xuất dữ liệu học viên'" : "Requires Owner permission"}
              className="px-3.5 py-2 bg-slate-100 text-slate-400 font-medium rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 cursor-not-allowed opacity-60"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              {language === 'vi' ? 'Xuất Dữ Liệu (Bị Khóa)' : 'Export Data (Locked)'}
            </button>
          )}

          {canAdd && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              {t('student.add_new')}
            </button>
          )}
        </div>
      </div>

      {/* Filters & View Mode Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-400" /> {t('student.filters')}
          </div>

          {/* Program Filter */}
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-700 font-medium"
          >
            <option value="all">{t('student.all_programs')}</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-700 font-medium"
          >
            <option value="all">{t('student.all_classes')}</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-700 font-medium"
          >
            <option value="all">{t('student.all_statuses')}</option>
            <option value="active">{t('actions.active')}</option>
            <option value="reserved">{t('actions.reserved')}</option>
            <option value="dropped">{t('actions.dropped')}</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Dạng Bảng</span>
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'card'
                ? 'bg-red-800 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span>Dạng Thẻ Mobile</span>
          </button>
        </div>
      </div>

      {/* STUDENT LIST: TABLE OR MOBILE CARDS */}
      {viewMode === 'table' ? (
        /* Student Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-800 text-slate-200 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('student.table_code')}</th>
                  <th className="py-3.5 px-4">{t('student.table_name')}</th>
                  <th className="py-3.5 px-4">{t('student.table_grade_school')}</th>
                  <th className="py-3.5 px-4">{t('student.table_program_class')}</th>
                  <th className="py-3.5 px-4">{t('student.table_phone')}</th>
                  <th className="py-3.5 px-4">{t('student.table_fee')}</th>
                  <th className="py-3.5 px-4">{t('student.table_status')}</th>
                  <th className="py-3.5 px-4 text-right">{t('student.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {t('student.no_matching')}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const program = programs.find(p => p.id === st.programId);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-red-800">
                          {st.code}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                              alt={st.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                              <div className="text-[10px] text-slate-500">{st.gender === 'Nam' ? (language === 'vi' ? 'Nam' : 'Male') : (st.gender === 'Nữ' ? (language === 'vi' ? 'Nữ' : 'Female') : (language === 'vi' ? 'Chưa xác định' : 'Unspecified'))} • {language === 'vi' ? 'NS' : 'DOB'}: {st.dob || '—'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{st.gradeLevel}</div>
                          <div className="text-[11px] text-slate-500">{st.school}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {(() => {
                              const cls = classes.find(c => c.id === st.classId);
                              if (cls) return cls.name;
                              if (st.classId === 'CLASS_G1') return 'Lớp 1 (Tiểu Học)';
                              if (st.classId === 'CLASS_G2') return 'Lớp 2 (Tiểu Học)';
                              if (st.classId === 'CLASS_G3') return 'Lớp 3 (Tiểu Học)';
                              if (st.classId === 'CLASS_G4') return 'Lớp 4 (Tiểu Học)';
                              if (st.classId === 'CLASS_G5') return 'Lớp 5 (Tiểu Học)';
                              if (st.classId === 'CLASS_G6') return 'Lớp 6 (THCS)';
                              if (st.classId === 'CLASS_G7') return 'Lớp 7 (THCS)';
                              if (st.classId === 'CLASS_G8') return 'Lớp 8 (THCS)';
                              if (st.classId === 'CLASS_G9') return 'Lớp 9 (THCS)';
                              if (st.classId === 'CLASS_G10') return 'Lớp 10 (THPT)';
                              if (st.classId === 'CLASS_G11') return 'Lớp 11 (THPT)';
                              if (st.classId === 'CLASS_G12') return 'Lớp 12 (THPT)';
                              if (st.classId === 'CLASS_MN') return 'Anh Văn Mầm Non';
                              if (st.classId === 'CLASS_CAM') return 'Lớp Cambridge';
                              if (st.classId === 'CLASS_IELTS') return 'Lớp IELTS Academic';
                              return st.classId || 'Chưa xếp lớp';
                            })()}
                          </div>
                          <div className="text-[11px] text-amber-700 font-medium">{program ? program.name : ''}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-red-700 flex-shrink-0" />
                            <span>{t('student.student_phone')} <span className="font-bold text-red-800">{st.phone || (language === 'vi' ? 'Chưa cập nhật' : 'N/A')}</span></span>
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>PH ({st.parentName}): <a href={`tel:${st.parentPhone}`} className="font-medium text-slate-800 hover:text-red-700">{st.parentPhone}</a></span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {st.feeStatus === 'paid' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle className="w-3 h-3 mr-1" /> {t('student.status_paid')}
                            </span>
                          )}
                          {st.feeStatus === 'unpaid' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                              <XCircle className="w-3 h-3 mr-1" /> {t('student.status_unpaid')}
                            </span>
                          )}
                          {st.feeStatus === 'debt' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertCircle className="w-3 h-3 mr-1" /> {t('student.status_debt')}
                            </span>
                          )}
                          {st.feeStatus === 'partial' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <AlertCircle className="w-3 h-3 mr-1" /> {t('student.status_partial')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {st.status === 'active' && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {t('actions.active')}
                            </span>
                          )}
                          {st.status === 'reserved' && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              {t('actions.reserved')}
                            </span>
                          )}
                          {st.status === 'dropped' && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                              {t('actions.dropped')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingStudent(st)}
                              className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 border border-blue-200"
                              title="Xem chi tiết & Lịch học"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Xem chi tiết</span>
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditingStudent(st);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Sửa học sinh"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm(`Xác nhận xóa học sinh ${st.name} (${st.code})?`)) {
                                    onDeleteStudent(st.id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Xóa học sinh"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              {t('student.no_matching')}
            </div>
          ) : (
            filteredStudents.map((st) => {
              const program = programs.find(p => p.id === st.programId);
              const cls = classes.find(c => c.id === st.classId);

              const classNameText = cls ? cls.name : (st.classId || 'Chưa xếp lớp');
              const scheduleText = cls ? `${cls.scheduleTime} (${cls.days.join(', ')})` : 'T2-T4-T6 (18:00 - 19:30)';

              return (
                <div key={st.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    {/* Header: Code, Avatar, Name & Status */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          alt={st.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-red-700 shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-red-100 text-red-900 border border-red-200">
                              {st.code}
                            </span>
                            {st.status === 'active' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Đang học
                              </span>
                            )}
                            {st.status === 'reserved' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Bảo lưu
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-base mt-1">{st.name}</h3>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {st.gradeLevel} • {st.school}
                          </div>
                        </div>
                      </div>

                      {/* Fee Badge */}
                      <div className="shrink-0">
                        {st.feeStatus === 'paid' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Đã đóng
                          </span>
                        )}
                        {st.feeStatus === 'debt' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            Còn nợ
                          </span>
                        )}
                        {st.feeStatus === 'unpaid' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                            Chưa đóng
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Class & Schedule Pill */}
                    <div className="my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-800 font-bold">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-red-700" />
                          {classNameText}
                        </span>
                        <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-1.5 py-0.5 rounded">
                          {program?.name || 'Khóa Tiếng Anh'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Lịch học: <strong className="text-slate-800">{scheduleText}</strong></span>
                      </div>
                    </div>

                    {/* Parent Contact */}
                    <div className="text-xs text-slate-600 space-y-1 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Phụ huynh: <strong>{st.parentName}</strong></span>
                        <a
                          href={`tel:${st.parentPhone}`}
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" /> {st.parentPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setViewingStudent(st)}
                      className="flex-1 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Xem chi tiết & Lịch học</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => {
                          if (confirm(`Xác nhận xóa học sinh ${st.name}?`)) {
                            onDeleteStudent(st.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RICH VIEW STUDENT DETAIL MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 custom-scrollbar">
            <button
              onClick={() => setViewingStudent(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-5 border-b border-slate-200">
              <img
                src={viewingStudent.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={viewingStudent.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-red-700 shadow-md"
              />
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300">
                    MÃ HỌC SINH: {viewingStudent.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    {viewingStudent.status === 'active' ? 'Đang theo học' : viewingStudent.status === 'reserved' ? 'Bảo lưu' : 'Nghỉ học'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">{viewingStudent.name}</h3>
                <div className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-3 mt-0.5">
                  <span>{viewingStudent.gender === 'Nam' ? 'Nam 👦' : (viewingStudent.gender === 'Nữ' ? 'Nữ 👧' : 'Chưa xác định')}</span>
                  <span>•</span>
                  <span>NS: {viewingStudent.dob}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-700">{viewingStudent.gradeLevel} ({viewingStudent.school})</span>
                </div>
              </div>
            </div>

            {/* SECTION: INDIVIDUAL TIMETABLE / LỊCH HỌC CÁ NHÂN */}
            {(() => {
              const cls = classes.find(c => c.id === viewingStudent.classId);
              const program = programs.find(p => p.id === viewingStudent.programId);
              const teacher = teachers.find(t => t.id === cls?.teacherId);
              const room = rooms.find(r => r.id === cls?.roomId);

              const activeDays = cls ? cls.days : ['Thứ 2', 'Thứ 4', 'Thứ 6'];
              const timeSlot = cls ? cls.scheduleTime : '18:00 - 19:30';
              const className = cls ? cls.name : (viewingStudent.classId || 'Chưa xếp lớp');

              const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

              return (
                <div className="my-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-purple-700" /> Lịch Học Cá Nhân Học Viên
                    </h4>
                    <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Lớp: {className}
                    </span>
                  </div>

                  {/* Class Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gradient-to-r from-red-50/50 via-slate-50 to-amber-50/50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <BookOpen className="w-4 h-4 text-red-700 shrink-0" />
                        <span>Chương trình: <strong className="text-slate-900">{program?.name || 'Anh Văn Phổ Thông'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Khung giờ ca học: <strong className="text-purple-800 font-extrabold">{timeSlot}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Lịch trong tuần: <strong className="text-emerald-800">{activeDays.join(', ')}</strong></span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Giáo viên phụ trách: <strong className="text-indigo-900">{teacher ? teacher.name : 'Thầy Mark Harrison'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <DoorOpen className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Phòng học cố định: <strong className="text-rose-900">{room ? room.name : 'Phòng P102 (Tầng 1)'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Ngày bắt đầu học: <strong className="text-slate-900">{viewingStudent.enrollDate}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Weekly Grid for Student */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Ma trận thời khóa biểu hàng tuần của {viewingStudent.name}:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 text-center">
                      {daysOfWeek.map((day) => {
                        const isStudyDay = activeDays.includes(day);
                        return (
                          <div
                            key={day}
                            className={`p-2 rounded-xl text-xs border transition-all ${
                              isStudyDay
                                ? 'bg-red-800 text-white border-red-900 shadow-2xs font-bold'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <div className="text-[10px] uppercase font-bold opacity-80">{day}</div>
                            {isStudyDay ? (
                              <div className="text-[11px] mt-1 font-extrabold text-amber-300">
                                {timeSlot.split('-')[0] || '18:00'}
                                <div className="text-[9px] font-medium text-white/90 truncate">{className}</div>
                              </div>
                            ) : (
                              <div className="text-[10px] mt-1 font-normal italic text-slate-400">
                                Nghỉ học
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SECTION: PARENT & CONTACT */}
            <div className="space-y-3 my-5 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" /> Thông Tin Phụ Huynh & Liên Hệ
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Họ tên phụ huynh</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{viewingStudent.parentName || 'Chưa cập nhật'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Số điện thoại phụ huynh</div>
                  <a href={`tel:${viewingStudent.parentPhone}`} className="font-extrabold text-emerald-700 text-sm hover:underline flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> {viewingStudent.parentPhone || 'Chưa cập nhật'}
                  </a>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Số điện thoại học sinh</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingStudent.phone || 'Chưa cập nhật'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Địa chỉ nhà</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingStudent.address || 'TP. Tây Ninh'}</div>
                </div>
              </div>
            </div>

            {/* SECTION: TUITION & NOTES */}
            <div className="space-y-3 my-5 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-700" /> Tình Trạng Học Phí & Ghi Chú
              </h4>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs">
                <div>
                  <div className="text-slate-500 font-medium">Trạng thái đóng phí:</div>
                  <div className="font-extrabold text-sm mt-0.5">
                    {viewingStudent.feeStatus === 'paid' && <span className="text-emerald-700">✅ Đã hoàn thành học phí</span>}
                    {viewingStudent.feeStatus === 'debt' && <span className="text-amber-800">⚠️ Còn nợ học phí</span>}
                    {viewingStudent.feeStatus === 'unpaid' && <span className="text-rose-700">❌ Chưa đóng học phí</span>}
                    {viewingStudent.feeStatus === 'partial' && <span className="text-blue-700">ℹ️ Đóng một phần học phí</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 font-medium">Ghi chú bổ sung:</div>
                  <div className="italic text-slate-700 font-medium">{viewingStudent.notes || 'Không có ghi chú đặc biệt'}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Trung Tâm Anh Ngữ Phúc Phúc Thịnh</span>
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STUDENT MODAL */}
      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingStudent(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-red-700" />
              {students.some(s => s.id === editingStudent.id) ? 'Cập Nhật Thông Tin Học Sinh' : 'Thêm Học Sinh Mới'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Học Sinh (Tự động)</label>
                  <input
                    type="text"
                    value={editingStudent.code}
                    onChange={(e) => setEditingStudent({ ...editingStudent, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-100 font-bold text-red-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ Và Tên *</label>
                  <input
                    type="text"
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Sinh</label>
                  <input
                    type="date"
                    value={editingStudent.dob}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới Tính</label>
                  <select
                    value={editingStudent.gender}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as 'Nam' | 'Nữ' | 'Chưa xác định' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Chưa xác định">Chưa xác định</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trường Đang Học</label>
                  <input
                    type="text"
                    value={editingStudent.school}
                    onChange={(e) => setEditingStudent({ ...editingStudent, school: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                    placeholder="THPT Chuyên Hoàng Lê Kha"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
                  <input
                    type="text"
                    value={editingStudent.gradeLevel}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                    placeholder="Khối 11"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chương Trình Học</label>
                  <select
                    value={editingStudent.programId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, programId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700 font-semibold"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Xếp Vào Lớp Học / Tên Lớp Học</label>
                  <div className="space-y-1.5">
                    <select
                      value={editingStudent.classId}
                      onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700 font-semibold text-slate-900"
                    >
                      <optgroup label="Danh Sách Lớp Học Tại Trung Tâm">
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </optgroup>
                      <optgroup label="Lớp Toán & Tiếng Việt (Bổ Trợ Tiểu Học)">
                        <option value="Lớp Toán & Tiếng Việt Lớp 1">Lớp Toán & Tiếng Việt Lớp 1</option>
                        <option value="Lớp Toán & Tiếng Việt Lớp 2">Lớp Toán & Tiếng Việt Lớp 2</option>
                        <option value="Lớp Toán & Tiếng Việt Lớp 3">Lớp Toán & Tiếng Việt Lớp 3</option>
                        <option value="Lớp Toán & Tiếng Việt Lớp 4">Lớp Toán & Tiếng Việt Lớp 4</option>
                        <option value="Lớp Toán & Tiếng Việt Lớp 5">Lớp Toán & Tiếng Việt Lớp 5</option>
                      </optgroup>
                      <optgroup label="Khối Lớp Phổ Thông (Từ Lớp 1 đến Lớp 12)">
                        <option value="CLASS_G1">Lớp 1 (Tiểu Học)</option>
                        <option value="CLASS_G2">Lớp 2 (Tiểu Học)</option>
                        <option value="CLASS_G3">Lớp 3 (Tiểu Học)</option>
                        <option value="CLASS_G4">Lớp 4 (Tiểu Học)</option>
                        <option value="CLASS_G5">Lớp 5 (Tiểu Học)</option>
                        <option value="CLASS_G6">Lớp 6 (THCS)</option>
                        <option value="CLASS_G7">Lớp 7 (THCS)</option>
                        <option value="CLASS_G8">Lớp 8 (THCS)</option>
                        <option value="CLASS_G9">Lớp 9 (THCS)</option>
                        <option value="CLASS_G10">Lớp 10 (THPT)</option>
                        <option value="CLASS_G11">Lớp 11 (THPT)</option>
                        <option value="CLASS_G12">Lớp 12 (THPT)</option>
                      </optgroup>
                      <optgroup label="Lớp Mầm Non & Khóa Học Đặc Biệt">
                        <option value="CLASS_MN">Lớp Anh Văn Mầm Non (3-5 tuổi)</option>
                        <option value="CLASS_CAM">Lớp Cambridge (Starters/Movers/Flyers)</option>
                        <option value="CLASS_IELTS">Lớp IELTS Academic 6.5+</option>
                        <option value="CLASS_TOEIC">Lớp TOEIC 650+ Giao Tiếp</option>
                        <option value="CLASS_TOEFL">Lớp TOEFL iBT Chuyên Sâu</option>
                      </optgroup>
                    </select>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Hoặc Tự Nhập Tên Lớp Học / Mã Lớp Tùy Chỉnh:</label>
                      <input
                        type="text"
                        value={editingStudent.classId}
                        onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                        placeholder="Nhập tên lớp học hoặc mã lớp tùy chỉnh..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-red-700 bg-amber-50/30"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại Học Viên</label>
                  <input
                    type="text"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700 font-semibold text-red-900"
                    placeholder="0936 123 456"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ Tên Phụ Huynh *</label>
                  <input
                    type="text"
                    value={editingStudent.parentName}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                    placeholder="Nguyễn Văn Hùng"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SĐT Phụ Huynh *</label>
                  <input
                    type="text"
                    value={editingStudent.parentPhone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                    placeholder="0918 222 333"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng Thái Học</label>
                  <select
                    value={editingStudent.status}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as StudentStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                  >
                    <option value="active">Đang học</option>
                    <option value="reserved">Bảo lưu</option>
                    <option value="dropped">Nghỉ học</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tình Trạng Học Phí</label>
                  <select
                    value={editingStudent.feeStatus}
                    onChange={(e) => setEditingStudent({ ...editingStudent, feeStatus: e.target.value as FeeStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700 font-semibold"
                  >
                    <option value="paid" className="text-emerald-700 font-bold">🟢 Đã đóng đủ</option>
                    <option value="unpaid" className="text-red-700 font-bold">🔴 Chưa đóng học phí</option>
                    <option value="debt" className="text-amber-700 font-bold">🟡 Còn nợ học phí</option>
                    <option value="partial" className="text-blue-700 font-bold">🔵 Đóng một phần</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Thường Trú</label>
                <input
                  type="text"
                  value={editingStudent.address}
                  onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                  placeholder="TP. Tây Ninh"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <textarea
                  value={editingStudent.notes || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700"
                  placeholder="Ghi chú thêm về học sinh..."
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-red-800 text-white rounded-xl font-bold hover:bg-red-900 shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Lưu Học Sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
