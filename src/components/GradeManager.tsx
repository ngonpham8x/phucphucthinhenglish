import React, { useState } from 'react';
import { Grade, Student, ClassRoom, StaffPermissions } from '../types';
import { Award, Trash2 } from 'lucide-react';
import { isStudentInClass } from '../lib/student';
import { HorizontalScrollArea } from './HorizontalScrollArea';

interface GradeManagerProps {
  grades: Grade[];
  students: Student[];
  classes: ClassRoom[];
  permissions: StaffPermissions;
  isOwner: boolean;
  onUpdateGrade: (updatedGrade: Grade) => void;
  onDeleteGrade?: (gradeId: string) => void;
  onClearGrades?: (gradeIds: string[]) => void;
}

type ScoreField = 'listening' | 'speaking' | 'reading' | 'writing' | 'midterm' | 'finalExam' | 'attendance';

const SCORE_COLUMNS: { field: ScoreField; label: string; headerClass?: string; cellClass?: string }[] = [
  { field: 'listening', label: 'Nghe (Listening)', headerClass: 'bg-slate-900/40', cellClass: 'bg-slate-50/50' },
  { field: 'speaking', label: 'Nói (Speaking)', headerClass: 'bg-slate-900/40', cellClass: 'bg-slate-50/50' },
  { field: 'reading', label: 'Đọc (Reading)', headerClass: 'bg-slate-900/40', cellClass: 'bg-slate-50/50' },
  { field: 'writing', label: 'Viết (Writing)', headerClass: 'bg-slate-900/40', cellClass: 'bg-slate-50/50' },
  { field: 'midterm', label: 'Giữa Kỳ' },
  { field: 'finalExam', label: 'Cuối Kỳ' },
  { field: 'attendance', label: 'Chuyên Cần' },
];

export const GradeManager: React.FC<GradeManagerProps> = ({
  grades,
  students,
  classes,
  permissions,
  isOwner,
  onUpdateGrade,
  onDeleteGrade,
  onClearGrades,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'all');

  const canEdit = isOwner || permissions.grade.edit;

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(
    s => selectedClassId === 'all' || isStudentInClass(s, selectedClassId, selectedClass)
  );

  const calculateAvg = (g: Grade): number => {
    // Weightings: Skills 40%, Midterm 20%, Final 30%, Attendance 10%
    const skillsAvg = (g.listening + g.speaking + g.reading + g.writing) / 4;
    const avg = (skillsAvg * 0.4) + (g.midterm * 0.2) + (g.finalExam * 0.3) + (g.attendance * 0.1);
    return Math.round(avg * 10) / 10;
  };

  const findStudentGrade = (studentId: string, targetClassId: string): Grade | undefined =>
    grades.find(g => g.studentId === studentId && (g.classId ? g.classId === targetClassId : true));

  const handleGradeChange = (studentId: string, targetClassId: string, field: ScoreField, rawValue: string) => {
    if (!targetClassId) return;
    const existing = findStudentGrade(studentId, targetClassId);
    if (rawValue.trim() === '' && !existing) return;

    const parsed = rawValue.trim() === '' ? 0 : parseFloat(rawValue);
    if (!Number.isFinite(parsed)) return;

    const base: Grade = existing || {
      id: `G_${studentId}_${targetClassId}`,
      studentId,
      classId: targetClassId,
      listening: 0,
      speaking: 0,
      reading: 0,
      writing: 0,
      midterm: 0,
      finalExam: 0,
      attendance: 0,
      average: 0,
    };

    const updated: Grade = {
      ...base,
      classId: targetClassId,
      [field]: Math.min(Math.max(parsed, 0), 10),
    };
    updated.average = calculateAvg(updated);
    onUpdateGrade(updated);
  };

  const visibleGradeIds = classStudents
    .map(st => {
      const targetClassId = selectedClassId !== 'all' ? selectedClassId : st.classId;
      return findStudentGrade(st.id, targetClassId)?.id;
    })
    .filter((id): id is string => Boolean(id));

  const handleClearVisibleGrades = () => {
    if (!isOwner || !onClearGrades || visibleGradeIds.length === 0) return;
    const scopeLabel = selectedClass ? `lớp "${selectedClass.name}"` : 'toàn bộ học viên đang hiển thị';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ điểm đã nhập (${visibleGradeIds.length} bản ghi) của ${scopeLabel} để đặt về trống không?`)) {
      return;
    }
    onClearGrades(visibleGradeIds);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-red-700" />
            Bảng Điểm & Đánh Giá Kỹ Năng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý điểm 4 kỹ năng Listening, Speaking, Reading, Writing, Giữa kỳ, Cuối kỳ & Chuyên cần
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-red-700"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {isOwner && onClearGrades && visibleGradeIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearVisibleGrades}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              title="Xóa toàn bộ điểm hiện có để bảng điểm trống"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa toàn bộ điểm ({visibleGradeIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Gradebook Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-clip">
        <HorizontalScrollArea>
          <table className="w-full min-w-[960px] text-left text-xs text-slate-700">
            <thead className="bg-slate-800 text-slate-200 uppercase text-[11px] font-bold">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Mã HS</th>
                <th className="py-3 px-4 whitespace-nowrap min-w-[170px]">Họ Và Tên</th>
                {SCORE_COLUMNS.map((col) => (
                  <th
                    key={col.field}
                    className={`py-3 px-3 text-center whitespace-nowrap ${col.headerClass || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="py-3 px-4 text-center bg-amber-600 text-slate-950 font-extrabold whitespace-nowrap">ĐTB</th>
                {isOwner && onDeleteGrade && (
                  <th className="py-3 px-3 text-center whitespace-nowrap">Thao Tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={isOwner && onDeleteGrade ? 11 : 10} className="py-10 text-center text-slate-400">
                    Chưa có học viên nào trong lớp này.
                  </td>
                </tr>
              ) : classStudents.map((st) => {
                const targetClassId = selectedClassId !== 'all' ? selectedClassId : st.classId;
                const grade = findStudentGrade(st.id, targetClassId);
                const rowEditable = canEdit && Boolean(targetClassId);

                return (
                  <tr key={`${st.id}-${targetClassId || 'unassigned'}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-red-800 whitespace-nowrap">{st.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {st.name}
                      {!targetClassId && (
                        <span className="ml-2 text-[10px] font-normal text-slate-400">(Chưa xếp lớp)</span>
                      )}
                    </td>

                    {SCORE_COLUMNS.map((col) => (
                      <td key={col.field} className={`p-2 text-center ${col.cellClass || ''}`}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="—"
                          value={grade ? grade[col.field] : ''}
                          disabled={!rowEditable}
                          title={!targetClassId ? 'Học sinh chưa xếp lớp — hãy xếp lớp trước khi nhập điểm' : undefined}
                          onChange={(e) => handleGradeChange(st.id, targetClassId, col.field, e.target.value)}
                          className="w-14 text-center py-1 border border-slate-300 rounded-lg font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-red-700 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                    ))}

                    {/* Average */}
                    <td className="py-3 px-4 text-center bg-amber-50 font-extrabold text-sm text-red-900 border-l border-amber-200 whitespace-nowrap">
                      {grade ? grade.average : '—'}
                    </td>

                    {isOwner && onDeleteGrade && (
                      <td className="p-2 text-center whitespace-nowrap">
                        {grade ? (
                          <button
                            type="button"
                            onClick={() => onDeleteGrade(grade.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={`Xóa điểm của ${st.name} về trống`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </HorizontalScrollArea>
      </div>
    </div>
  );
};
