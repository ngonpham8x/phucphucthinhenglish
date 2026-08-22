import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Student,
  Teacher,
  ClassRoom,
  Room,
  CourseProgram,
  TimetableSlot,
  Grade,
  TuitionReceipt,
  UserAccount,
  ActivityLog,
  SystemBackup,
  CenterSettings
} from './types';
import {
  initialSettings,
  initialPrograms,
  initialTeachers,
  initialRooms,
  initialClasses,
  initialStudents,
  initialTimetableSlots,
  initialGrades,
  initialTuitionReceipts,
  initialBackups,
  initialActivityLogs
} from './mock/initialData';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudentManager } from './components/StudentManager';
import { TeacherManager } from './components/TeacherManager';
import { ClassManager } from './components/ClassManager';
import { RoomManager } from './components/RoomManager';
import { TimetableManager } from './components/TimetableManager';
import { TeacherScheduleMatrix } from './components/TeacherScheduleMatrix';
import { GradeManager } from './components/GradeManager';
import { TuitionManager } from './components/TuitionManager';
import { ReportView } from './components/ReportView';
import { ActivityLogView } from './components/ActivityLogView';
import { SystemSettingsModal } from './components/SystemSettingsModal';
import { LoginModal } from './components/LoginModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { AuthScreen } from './components/AuthScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { profileToAccount, ProfileRow } from './lib/auth';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { CenterWorkbookData } from './services/excelService';

const ImportExportModal = lazy(() => import('./components/ImportExportModal').then((module) => ({ default: module.ImportExportModal })));
const BackupManager = lazy(() => import('./components/BackupManager').then((module) => ({ default: module.BackupManager })));

interface CenterDataPayload {
  settings: CenterSettings;
  programs: CourseProgram[];
  teachers: Teacher[];
  rooms: Room[];
  classes: ClassRoom[];
  students: Student[];
  timetableSlots: TimetableSlot[];
  grades: Grade[];
  receipts: TuitionReceipt[];
  backups: SystemBackup[];
  activityLogs: ActivityLog[];
}

const DATA_SCHEMA_VERSION = 'secure-supabase-import-v1';
const DATA_STORE_KEYS = [
  'settings',
  'teachers',
  'rooms',
  'classes',
  'students',
  'timetableSlots',
  'grades',
  'receipts',
  'backups',
  'activityLogs'
] as const;

const canAccessTab = (tab: string, user: UserAccount) => {
  if (user.role === 'owner') return true;
  const permissions = user.permissions;

  switch (tab) {
    case 'dashboard': return true;
    case 'students': return permissions.student.view;
    case 'teachers': return permissions.teacher.view;
    case 'classes': return permissions.student.view;
    case 'rooms':
    case 'timetable':
    case 'teacher-schedule': return permissions.student.view || permissions.teacher.view;
    case 'grades': return permissions.grade.view;
    case 'tuition': return permissions.tuition.view;
    case 'reports': return permissions.report.view && permissions.report.revenue;
    case 'excel-import-export': return permissions.excel.import || permissions.excel.export;
    default: return false;
  }
};

export default function App() {
  // Persistence Helper with localStorage
  const ensureDataSchema = () => {
    try {
      if (localStorage.getItem('PHUC_PHUC_THINH_DATA_VERSION') === DATA_SCHEMA_VERSION) return;
      DATA_STORE_KEYS.forEach((key) => localStorage.removeItem(`PHUC_PHUC_THINH_${key}`));
      localStorage.setItem('PHUC_PHUC_THINH_DATA_VERSION', DATA_SCHEMA_VERSION);
    } catch (error) {
      console.error(error);
    }
  };

  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      ensureDataSchema();
      if (isSupabaseConfigured) return fallback;
      const stored = localStorage.getItem(`PHUC_PHUC_THINH_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const saveStored = <T,>(key: string, value: T) => {
    try {
      if (isSupabaseConfigured) return;
      localStorage.setItem(`PHUC_PHUC_THINH_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  };

  // State Management
  const [settings, setSettings] = useState<CenterSettings>(() => loadStored('settings', initialSettings));
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'ready' | 'signed-out' | 'blocked'>(
    isSupabaseConfigured ? 'loading' : 'signed-out'
  );
  const [isCenterDataHydrated, setIsCenterDataHydrated] = useState(!isSupabaseConfigured);
  const [canSyncCenterData, setCanSyncCenterData] = useState(false);
  const [hasCenterData, setHasCenterData] = useState(false);

  const [programs, setPrograms] = useState<CourseProgram[]>(() => isSupabaseConfigured ? [] : initialPrograms);
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadStored('teachers', initialTeachers));
  const [rooms, setRooms] = useState<Room[]>(() => loadStored('rooms', initialRooms));
  const [classes, setClasses] = useState<ClassRoom[]>(() => loadStored('classes', initialClasses));
  const [students, setStudents] = useState<Student[]>(() => loadStored('students', initialStudents));
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => loadStored('timetableSlots', initialTimetableSlots));
  const [grades, setGrades] = useState<Grade[]>(() => loadStored('grades', initialGrades));
  const [receipts, setReceipts] = useState<TuitionReceipt[]>(() => loadStored('receipts', initialTuitionReceipts));
  const [backups, setBackups] = useState<SystemBackup[]>(() => loadStored('backups', initialBackups));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadStored('activityLogs', initialActivityLogs));

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const contentViewportRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      // The page can scroll on desktop while the main area scrolls on smaller
      // viewports. Reset both whenever the user changes a menu/tab.
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      contentViewportRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeTab]);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);

  // Sync to LocalStorage
  useEffect(() => saveStored('settings', settings), [settings]);
  useEffect(() => saveStored('teachers', teachers), [teachers]);
  useEffect(() => saveStored('rooms', rooms), [rooms]);
  useEffect(() => saveStored('classes', classes), [classes]);
  useEffect(() => saveStored('students', students), [students]);
  useEffect(() => saveStored('timetableSlots', timetableSlots), [timetableSlots]);
  useEffect(() => saveStored('grades', grades), [grades]);
  useEffect(() => saveStored('receipts', receipts), [receipts]);
  useEffect(() => saveStored('backups', backups), [backups]);
  useEffect(() => saveStored('activityLogs', activityLogs), [activityLogs]);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;
    const resolveSession = async (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);

      if (!nextSession) {
        setCurrentUser(null);
        setIsCenterDataHydrated(!isSupabaseConfigured);
        setCanSyncCenterData(false);
        setHasCenterData(false);
        setAuthStatus('signed-out');
        return;
      }

      setAuthStatus('loading');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, is_active, permissions')
        .eq('id', nextSession.user.id)
        .maybeSingle();

      if (!isMounted) return;
      if (error || !data || !data.is_active) {
        setCurrentUser(null);
        setAuthStatus('blocked');
        return;
      }

      const account = profileToAccount(data as ProfileRow, nextSession.user);
      setCurrentUser(account);
      setIsCenterDataHydrated(false);
      setHasCenterData(false);
      const { data: centerData, error: centerDataError } = await supabase
        .from('center_data')
        .select('payload')
        .eq('id', 'primary')
        .maybeSingle();

      if (!isMounted) return;
      if (!centerDataError) {
        const payload = centerData?.payload as Partial<CenterDataPayload> | undefined;
        const hasPayload = Boolean(payload && typeof payload === 'object' && Object.keys(payload).length > 0);
        if (hasPayload && payload) {
          if (payload.settings) setSettings(payload.settings);
          if (Array.isArray(payload.programs)) setPrograms(payload.programs);
          if (Array.isArray(payload.teachers)) setTeachers(payload.teachers);
          if (Array.isArray(payload.rooms)) setRooms(payload.rooms);
          if (Array.isArray(payload.classes)) setClasses(payload.classes);
          if (Array.isArray(payload.students)) setStudents(payload.students);
          if (Array.isArray(payload.timetableSlots)) setTimetableSlots(payload.timetableSlots);
          if (Array.isArray(payload.grades)) setGrades(payload.grades);
          if (Array.isArray(payload.receipts)) setReceipts(payload.receipts);
          if (Array.isArray(payload.backups)) setBackups(payload.backups);
          if (Array.isArray(payload.activityLogs)) setActivityLogs(payload.activityLogs);
        }
        setCanSyncCenterData(true);
        setHasCenterData(hasPayload);
      } else {
        console.warn('Không thể tải dữ liệu trung tâm từ Supabase:', centerDataError.message);
        setCanSyncCenterData(false);
        setHasCenterData(false);
      }
      setIsCenterDataHydrated(true);
      setAuthStatus('ready');
    };

    void supabase.auth.getSession().then(({ data }) => resolveSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void resolveSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !currentUser || !isCenterDataHydrated || !canSyncCenterData || !hasCenterData) return;
    const payload: CenterDataPayload = { settings, programs, teachers, rooms, classes, students, timetableSlots, grades, receipts, backups, activityLogs };
    const timer = window.setTimeout(() => {
      void supabase
        .from('center_data')
        .upsert({ id: 'primary', payload }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('Không thể đồng bộ dữ liệu trung tâm:', error.message);
        });
    }, 750);
    return () => window.clearTimeout(timer);
  }, [settings, programs, teachers, rooms, classes, students, timetableSlots, grades, receipts, backups, activityLogs, currentUser, isCenterDataHydrated, canSyncCenterData, hasCenterData]);

  // Activity Logger
  const addLog = (
    action: 'ĐĂNG NHẬP' | 'THÊM' | 'SỬA' | 'XÓA' | 'EXPORT' | 'IMPORT' | 'BACKUP' | 'RESTORE' | 'ĐỒNG BỘ',
    module: string,
    details: string
  ) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: `LOG_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      userEmail: '',
      userName: currentUser.name,
      action,
      module,
      details
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Student CRUD Handlers
  const handleAddStudent = (newStudent: Student) => {
    setStudents(prev => [newStudent, ...prev]);
    addLog('THÊM', 'Học sinh', `Thêm mới học sinh ${newStudent.name} (${newStudent.code})`);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    addLog('SỬA', 'Học sinh', `Cập nhật thông tin học sinh ${updatedStudent.name} (${updatedStudent.code})`);
  };

  const handleDeleteStudent = (id: string) => {
    const st = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    if (st) addLog('XÓA', 'Học sinh', `Xóa học sinh ${st.name} (${st.code}) khỏi hệ thống`);
  };

  const handleImportStudents = (newStudentsList: Student[]) => {
    setStudents(prev => [...newStudentsList, ...prev]);
    setClasses(prev => prev.map((classroom) => ({
      ...classroom,
      studentIds: [...classroom.studentIds, ...newStudentsList.filter((student) => student.classId === classroom.id).map((student) => student.id)]
    })));
    addLog('IMPORT', 'Excel', `Import ${newStudentsList.length} học sinh mới từ file Excel`);
  };

  const handleImportCenterData = (data: CenterWorkbookData) => {
    setPrograms(data.programs);
    setTeachers(data.teachers);
    setRooms(data.rooms);
    setClasses(data.classes);
    setStudents(data.students);
    setTimetableSlots(data.timetableSlots);
    setGrades(data.grades);
    setReceipts(data.receipts);
    setBackups([]);
    setHasCenterData(true);
    setActivityLogs(currentUser ? [{
      id: `LOG_IMPORT_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      userEmail: currentUser.email,
      userName: currentUser.name,
      action: 'IMPORT',
      module: 'Excel',
      details: `Nhập dữ liệu trung tâm: ${data.classes.length} lớp, ${data.students.length} học sinh, ${data.receipts.length} phiếu thu.`
    }] : []);
  };

  // Teacher CRUD Handlers
  const handleAddTeacher = (t: Teacher) => {
    setTeachers(prev => [...prev, t]);
    addLog('THÊM', 'Giáo viên', `Thêm giáo viên mới ${t.name}`);
  };

  const handleUpdateTeacher = (t: Teacher) => {
    setTeachers(prev => prev.map(item => item.id === t.id ? t : item));
    addLog('SỬA', 'Giáo viên', `Cập nhật thông tin giáo viên ${t.name}`);
  };

  const handleDeleteTeacher = (id: string) => {
    const t = teachers.find(item => item.id === id);
    setTeachers(prev => prev.filter(item => item.id !== id));
    if (t) addLog('XÓA', 'Giáo viên', `Xóa giáo viên ${t.name}`);
  };

  // Class CRUD Handlers
  const handleAddClass = (c: ClassRoom) => {
    setClasses(prev => [...prev, c]);
    addLog('THÊM', 'Lớp học', `Tạo lớp học mới ${c.name} (${c.code})`);
  };

  const handleUpdateClass = (c: ClassRoom) => {
    setClasses(prev => prev.map(item => item.id === c.id ? c : item));
    addLog('SỬA', 'Lớp học', `Cập nhật lớp học ${c.name} (${c.code})`);
  };

  const handleDeleteClass = (id: string) => {
    const c = classes.find(item => item.id === id);
    setClasses(prev => prev.filter(item => item.id !== id));
    if (c) addLog('XÓA', 'Lớp học', `Xóa lớp học ${c.name} (${c.code})`);
  };

  // Room CRUD Handlers
  const handleAddRoom = (r: Room) => {
    setRooms(prev => [...prev, r]);
    addLog('THÊM', 'Phòng học', `Thêm phòng học ${r.name}`);
  };

  const handleUpdateRoom = (r: Room) => {
    setRooms(prev => prev.map(item => item.id === r.id ? r : item));
    addLog('SỬA', 'Phòng học', `Cập nhật phòng học ${r.name}`);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(item => item.id !== id));
    addLog('XÓA', 'Phòng học', `Xóa phòng học`);
  };

  // Timetable Handlers
  const handleAddSlot = (slot: TimetableSlot) => {
    setTimetableSlots(prev => [...prev, slot]);
    addLog('THÊM', 'Thời khóa biểu', `Thêm ca học mới vào ${slot.dayOfWeek} (${slot.startTime}-${slot.endTime})`);
  };

  const handleUpdateSlot = (slot: TimetableSlot) => {
    setTimetableSlots(prev => prev.map(s => s.id === slot.id ? slot : s));
    addLog('SỬA', 'Thời khóa biểu', `Cập nhật ca học vào ${slot.dayOfWeek}`);
  };

  const handleDeleteSlot = (id: string) => {
    setTimetableSlots(prev => prev.filter(s => s.id !== id));
    addLog('XÓA', 'Thời khóa biểu', `Xóa ca học khỏi thời khóa biểu`);
  };

  // Grade Handler
  const handleUpdateGrade = (updatedGrade: Grade) => {
    setGrades(prev => {
      const idx = prev.findIndex(g => g.studentId === updatedGrade.studentId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedGrade;
        return next;
      }
      return [...prev, updatedGrade];
    });
    addLog('SỬA', 'Điểm', `Cập nhật bảng điểm cho học sinh ID ${updatedGrade.studentId}`);
  };

  // Tuition Handler
  const handleAddReceipt = (r: TuitionReceipt) => {
    setReceipts(prev => [r, ...prev]);

    // Update student feeStatus
    setStudents(prev => prev.map(s => {
      if (s.id === r.studentId) {
        return {
          ...s,
          feeStatus: r.debtAmount === 0 ? 'paid' : 'debt'
        };
      }
      return s;
    }));

    addLog('THÊM', 'Học phí', `Lập phiếu thu ${r.code} số tiền ${r.paidAmount.toLocaleString('vi-VN')} đ`);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    setAuthStatus('signed-out');
    setIsLoginOpen(false);
  };

  if (authStatus === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền truy cập…
      </main>
    );
  }

  if (authStatus === 'blocked') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
        <section className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl">
          <h1 className="font-extrabold text-red-900">Tài khoản chưa được cấp quyền</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Liên hệ Chủ trung tâm để nhận lời mời hoặc kiểm tra lại trạng thái tài khoản.</p>
          <button onClick={() => void handleLogout()} className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Đăng xuất</button>
        </section>
      </main>
    );
  }

  if (!currentUser || !session) return <AuthScreen />;

  const navigateTo = (tab: string) => {
    if (canAccessTab(tab, currentUser)) setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Header Navigation */}
      <Header
        currentUser={currentUser}
        settings={settings}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenPwaInstall={() => setIsPwaModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogout={() => void handleLogout()}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigateTo}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          currentUser={currentUser}
          onOpenPwaInstall={() => setIsPwaModalOpen(true)}
        />

        {/* Content View Container */}
        <main ref={contentViewportRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              teachers={teachers}
              classes={classes}
              rooms={rooms}
              receipts={receipts}
              programs={programs}
              currentUser={currentUser}
              onNavigateTab={navigateTo}
            />
          )}

          {activeTab === 'students' && (
            <StudentManager
              students={students}
              programs={programs}
              classes={classes}
              teachers={teachers}
              rooms={rooms}
              permissions={currentUser.permissions}
              isOwner={currentUser.role === 'owner'}
              searchQuery={searchQuery}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
            />
          )}

          {activeTab === 'teachers' && (
            <TeacherManager
              teachers={teachers}
              classes={classes}
              permissions={currentUser.permissions}
              isOwner={currentUser.role === 'owner'}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {activeTab === 'classes' && (
            <ClassManager
              classes={classes}
              teachers={teachers}
              rooms={rooms}
              programs={programs}
              students={students}
              permissions={currentUser.permissions}
              isOwner={currentUser.role === 'owner'}
              onAddClass={handleAddClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomManager
              rooms={rooms}
              classes={classes}
              permissions={currentUser.permissions}
              isOwner={currentUser.role === 'owner'}
              onAddRoom={handleAddRoom}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableManager
              timetableSlots={timetableSlots}
              classes={classes}
              teachers={teachers}
              rooms={rooms}
              isOwner={currentUser.role === 'owner'}
              onAddSlot={handleAddSlot}
              onUpdateSlot={handleUpdateSlot}
              onDeleteSlot={handleDeleteSlot}
            />
          )}

          {activeTab === 'teacher-schedule' && (
            <TeacherScheduleMatrix
              teachers={teachers}
              timetableSlots={timetableSlots}
              classes={classes}
              rooms={rooms}
            />
          )}

          {activeTab === 'grades' && (
            <GradeManager
              grades={grades}
              students={students}
              classes={classes}
              permissions={currentUser.permissions}
              isOwner={currentUser.role === 'owner'}
              onUpdateGrade={handleUpdateGrade}
            />
          )}

          {activeTab === 'tuition' && (
            <TuitionManager
              receipts={receipts}
              students={students}
              classes={classes}
              programs={programs}
              permissions={currentUser.permissions}
              settings={settings}
              isOwner={currentUser.role === 'owner'}
              onAddReceipt={handleAddReceipt}
            />
          )}

          {activeTab === 'excel-import-export' && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Import / Export File ExcelJS</h3>
              <p className="text-xs text-slate-500 mb-4">Quản lý nhập dữ liệu hàng loạt và xuất Workbook nhiều Sheet liên kết công thức</p>
              <button
                onClick={() => setIsImportExportModalOpen(true)}
                className="px-4 py-2 bg-red-800 text-white rounded-xl font-bold text-xs"
              >
                Mở Cửa Sổ Import / Export Excel
              </button>
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportView
              students={students}
              teachers={teachers}
              classes={classes}
              receipts={receipts}
            />
          )}

          {activeTab === 'backups' && (
            <Suspense fallback={<div className="p-6 text-sm text-slate-500">Đang tải công cụ sao lưu…</div>}>
              <BackupManager
                backups={backups}
                settings={settings}
                students={students}
                teachers={teachers}
                rooms={rooms}
                classes={classes}
                receipts={receipts}
                grades={grades}
                onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
              />
            </Suspense>
          )}

          {activeTab === 'activity-logs' && (
            <ActivityLogView logs={activityLogs} />
          )}

          {activeTab === 'settings' && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Cài Đặt Hệ Thống</h3>
              <p className="text-xs text-slate-500 mb-4">Thông tin trung tâm & cấu hình gửi email tự động</p>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Chỉnh Sửa Cài Đặt Hệ Thống
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        accessToken={session.access_token}
      />

      {isImportExportModalOpen && (
        <Suspense fallback={null}>
          <ImportExportModal
            isOpen={isImportExportModalOpen}
            onClose={() => setIsImportExportModalOpen(false)}
            students={students}
            teachers={teachers}
            rooms={rooms}
            classes={classes}
            receipts={receipts}
            grades={grades}
            settings={settings}
            canSyncCenterData={canSyncCenterData}
            isOwner={currentUser.role === 'owner'}
            permissions={currentUser.permissions}
            onImportStudents={handleImportStudents}
            onImportCenterData={handleImportCenterData}
          />
        </Suspense>
      )}

      <SystemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(s) => {
          setSettings(s);
          addLog('SỬA', 'Cài đặt', 'Cập nhật thông tin trung tâm & email báo cáo hằng tuần');
        }}
      />

      {isBackupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBackupModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              ✕
            </button>
            <Suspense fallback={<div className="p-6 text-sm text-slate-500">Đang tải công cụ sao lưu…</div>}>
              <BackupManager
                backups={backups}
                settings={settings}
                students={students}
                teachers={teachers}
                rooms={rooms}
                classes={classes}
                receipts={receipts}
                grades={grades}
                onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
              />
            </Suspense>
          </div>
        </div>
      )}

      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}
