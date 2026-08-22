import {
  ActivityLog,
  CenterSettings,
  ClassRoom,
  CourseProgram,
  Grade,
  Room,
  Student,
  SystemBackup,
  Teacher,
  TimetableSlot,
  TuitionReceipt
} from '../types';

// No student, parent, financial, or staff personal data is bundled with the web app.
// The owner imports the private workbook after Google sign-in; the payload is stored in Supabase under RLS.
export const initialSettings: CenterSettings = {
  name: 'TRUNG TÂM ANH NGỮ PHÚC PHÚC THỊNH',
  slogan: '',
  address: '',
  phone: '',
  email: '',
  adminReportEmail: '',
  autoEmailReport: false,
  autoBackup: false,
  sheetsConfig: { spreadsheetId: '', sheetName: '', autoSync: false, syncInterval: 'weekly', connected: false }
};

export const initialPrograms: CourseProgram[] = [
  {
    id: 'PROG-IMPORTED',
    code: 'IMPORTED',
    name: 'Chương trình nhập từ Excel',
    category: 'Khác',
    tuitionFee: 0,
    description: 'Chương trình được tạo khi nhập dữ liệu riêng của trung tâm.'
  }
];

export const initialTeachers: Teacher[] = [];
export const initialRooms: Room[] = [];
export const initialClasses: ClassRoom[] = [];
export const initialStudents: Student[] = [];
export const initialTimetableSlots: TimetableSlot[] = [];
export const initialGrades: Grade[] = [];
export const initialTuitionReceipts: TuitionReceipt[] = [];
export const initialBackups: SystemBackup[] = [];
export const initialActivityLogs: ActivityLog[] = [];
