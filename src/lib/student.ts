import { Student, ClassRoom } from '../types';

export const nextStudentCode = (students: Pick<Student,'code'>[]): string => {
  const used = new Set(students.map(student => student.code.trim().toUpperCase()));
  let next = students.reduce((maximum,student) => {
    const match = student.code.trim().match(/^HS(\d+)$/i);
    const number=match ? Number(match[1]) : 0;
    return Number.isSafeInteger(number) && number<Number.MAX_SAFE_INTEGER-1 ? Math.max(maximum,number) : maximum;
  },0) + 1;
  while (used.has(`HS${String(next).padStart(3,'0')}`)) next++;
  return `HS${String(next).padStart(3,'0')}`;
};

/**
 * Checks if a student belongs to a given class (primary, extra classes, or enrolled in classroom.studentIds).
 */
export const isStudentInClass = (
  student: Student,
  classId: string,
  classroom?: ClassRoom | null
): boolean => {
  if (!classId) return false;
  if (student.classId === classId) return true;
  if (student.extraClassIds && student.extraClassIds.includes(classId)) return true;
  if (classroom && classroom.id === classId && classroom.studentIds?.includes(student.id)) return true;
  return false;
};

/**
 * Returns all unique class IDs that a student is associated with.
 */
export const getStudentClassIds = (
  student: Student,
  classrooms?: ClassRoom[]
): string[] => {
  const ids = new Set<string>();
  if (student.classId && student.classId.trim()) {
    ids.add(student.classId.trim());
  }
  if (Array.isArray(student.extraClassIds)) {
    student.extraClassIds.forEach((id) => {
      if (id && id.trim()) ids.add(id.trim());
    });
  }
  if (classrooms) {
    classrooms.forEach((cls) => {
      if (cls.studentIds?.includes(student.id)) {
        ids.add(cls.id);
      }
    });
  }
  return Array.from(ids);
};

/**
 * Returns all students enrolled in a classroom.
 */
export const getEnrolledStudentsForClass = (
  classroom: ClassRoom,
  students: Student[]
): Student[] => {
  return students.filter((student) => isStudentInClass(student, classroom.id, classroom));
};

