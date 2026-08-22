import React from 'react';
import { Student, Teacher, ClassRoom, Room, TuitionReceipt, CourseProgram, UserAccount } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  Users,
  GraduationCap,
  Building2,
  Building,
  DollarSign,
  UserCheck,
  UserMinus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Eye,
  Edit2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Bell,
  Gift,
  Cloud,
  CreditCard,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  rooms: Room[];
  receipts: TuitionReceipt[];
  programs: CourseProgram[];
  currentUser: UserAccount;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  classes,
  rooms,
  receipts,
  programs,
  currentUser,
  onNavigateTab
}) => {
  const { t, language } = useLanguage();
  const isOwner = currentUser.role === 'owner';
  const showRevenue = isOwner || (currentUser.permissions.report?.revenue ?? false);
  const showDebt = isOwner || (currentUser.permissions.tuition?.showDebt ?? false);

  // Chart 1: Học sinh theo chương trình (Donut)
  const programDonutData = [
    { name: language === 'vi' ? 'Tiếng Anh Cấp 1' : 'Primary English', value: 120, percentage: '33.7%', color: '#EF4444' },
    { name: language === 'vi' ? 'Tiếng Anh Cấp 2' : 'Secondary English', value: 95, percentage: '26.7%', color: '#F59E0B' },
    { name: language === 'vi' ? 'Tiếng Anh Cấp 3' : 'High School English', value: 80, percentage: '22.5%', color: '#3B82F6' },
    { name: 'IELTS', value: 40, percentage: '11.2%', color: '#10B981' },
    { name: 'TOEIC', value: 21, percentage: '5.9%', color: '#8B5CF6' }
  ];

  // Chart 2: Doanh thu 6 tháng gần nhất (Line chart)
  const revenue6MonthsData = [
    { month: '12/2023', revenue: 50 },
    { month: '01/2024', revenue: 80 },
    { month: '02/2024', revenue: 100 },
    { month: '03/2024', revenue: 145 },
    { month: '04/2024', revenue: 185 },
    { month: '05/2024', revenue: 220 }
  ];

  // Chart 3: Tình trạng học phí (Donut)
  const tuitionStatusDonutData = [
    { name: t('student.status_paid'), value: 323, percentage: '90.4%', color: '#10B981' },
    { name: t('student.status_debt'), value: 32, percentage: '9.0%', color: '#EF4444' },
    { name: language === 'vi' ? 'Tạm ứng' : 'Advance', value: 1, percentage: '0.6%', color: '#F59E0B' }
  ];

  // Chart 4: Doanh thu 12 tháng gần nhất (Bar chart)
  const revenue12MonthsData = [
    { month: '06/2023', amount: 120 },
    { month: '07/2023', amount: 160 },
    { month: '08/2023', amount: 150 },
    { month: '09/2023', amount: 140 },
    { month: '10/2023', amount: 180 },
    { month: '11/2023', amount: 195 },
    { month: '12/2023', amount: 210 },
    { month: '01/2024', amount: 205 },
    { month: '02/2024', amount: 215 },
    { month: '03/2024', amount: 220 },
    { month: '04/2024', amount: 225 },
    { month: '05/2024', amount: 230 }
  ];

  // Sample table data matching screenshot
  const studentRows = [
    { code: 'HS240001', name: 'Nguyễn Minh Anh', classCode: 'Lớp 1A', program: 'Tiếng Anh Cấp 1', phone: '0901234567', status: 'Đang học', debt: '0đ' },
    { code: 'HS240002', name: 'Trần Gia Bảo', classCode: 'Lớp 2B', program: 'Tiếng Anh Cấp 2', phone: '0912345678', status: 'Đang học', debt: '1.500.000đ' },
    { code: 'HS240003', name: 'Lê Hoàng Nam', classCode: 'Lớp 3A', program: 'Tiếng Anh Cấp 3', phone: '0933456789', status: 'Đang học', debt: '0đ' },
    { code: 'HS240004', name: 'Phạm Ngọc Linh', classCode: 'IELTS 02', program: 'IELTS', phone: '0944567890', status: 'Đang học', debt: '2.500.000đ' },
    { code: 'HS240005', name: 'Đặng Minh Khoa', classCode: 'TOEIC 01', program: 'TOEIC', phone: '0955678901', status: 'Nghỉ học', debt: '0đ' }
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* ------------------------------------------------------------- */}
      {/* ROW 1: 5 STAT CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng học sinh */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.total_students')}</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">356</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
              <span className="text-emerald-500 font-bold mr-1">↑ 12</span> {t('dashboard.compared_prev_month')}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Tổng giáo viên */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.total_teachers')}</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">28</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
              <span className="text-emerald-500 font-bold mr-1">↑ 2</span> {t('dashboard.compared_prev_month')}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Tổng lớp */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.total_classes')}</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">32</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
              <span className="text-emerald-500 font-bold mr-1">↑ 3</span> {t('dashboard.compared_prev_month')}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tổng phòng */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.total_rooms')}</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">12</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {t('dashboard.no_change')}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Doanh thu tháng hoặc Cần thu học phí */}
        {showRevenue ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">{t('dashboard.monthly_revenue')}</span>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">215.800.000đ</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
                <span className="text-emerald-500 font-bold mr-1">↑ 18%</span> {t('dashboard.compared_prev_month')}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">{t('dashboard.pending_tuition')}</span>
              <div className="text-lg font-extrabold text-amber-700 mt-0.5">32 {t('class.students')}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center">
                <span className="text-amber-600 font-bold mr-1">21.800.000đ</span> {language === 'vi' ? 'còn nợ phải thu' : 'outstanding'}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 2: STATUS PILL CARDS (4 CARDS) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pill 1: Đang học */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">{t('actions.active')}</span>
            <div className="text-xl font-bold text-slate-900">330</div>
          </div>
        </div>

        {/* Pill 2: Nghỉ học */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">{t('actions.dropped')}</span>
            <div className="text-xl font-bold text-slate-900">15</div>
          </div>
        </div>

        {/* Pill 3: Nợ học phí */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">{t('student.status_debt')}</span>
            <div className="text-xl font-bold text-slate-900">32</div>
          </div>
        </div>

        {/* Pill 4: Đã đóng đủ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">{t('student.status_paid')}</span>
            <div className="text-xl font-bold text-slate-900">323</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 3: CHARTS & NOTIFICATIONS GRID */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chart 1: Học sinh theo chương trình */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-sm mb-3">{t('dashboard.students_by_program')}</h3>
          <div className="flex items-center gap-2">
            <div className="w-32 h-32 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={programDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {programDonutData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs flex-1">
              {programDonutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 text-[11px] truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-[11px] ml-1">{item.value} ({item.percentage})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Doanh thu 6 tháng gần nhất hoặc Tăng trưởng sĩ số */}
        {showRevenue ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3">{t('dashboard.revenue_6_months')}</h3>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue6MonthsData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val}M`} />
                  <Tooltip formatter={(val) => [`${val}M VNĐ`, language === 'vi' ? 'Doanh thu' : 'Revenue']} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#DC2626"
                    strokeWidth={2}
                    dot={{ fill: '#DC2626', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3">{t('dashboard.student_growth')}</h3>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { month: '12/2023', students: 290 },
                  { month: '01/2024', students: 310 },
                  { month: '02/2024', students: 325 },
                  { month: '03/2024', students: 340 },
                  { month: '04/2024', students: 348 },
                  { month: '05/2024', students: 356 }
                ]}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => [`${val} ${t('class.students')}`, language === 'vi' ? 'Sĩ số' : 'Count']} />
                  <Line
                    type="monotone"
                    dataKey="students"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ fill: '#2563EB', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 3: Tình trạng học phí */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-sm mb-3">{t('dashboard.tuition_status')}</h3>
          <div className="flex items-center gap-2">
            <div className="w-32 h-32 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tuitionStatusDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {tuitionStatusDonutData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs flex-1">
              {tuitionStatusDonutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 text-[11px] truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-[11px] ml-1">{item.value} ({item.percentage})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 4: Thông báo */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">{t('dashboard.notifications')}</h3>
            <button className="text-xs font-semibold text-red-600 hover:underline">{t('dashboard.view_all')}</button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex gap-2.5 items-start">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-600 flex-shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{language === 'vi' ? 'Học sinh Trần Minh Khang' : 'Student Tran Minh Khang'}</div>
                <div className="text-slate-500 text-[11px]">{language === 'vi' ? 'còn nợ học phí 2.500.000đ' : 'tuition fee due: 2,500,000 VND'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{language === 'vi' ? '2 phút trước' : '2 mins ago'}</div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 flex-shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{language === 'vi' ? 'Lớp IELTS 03 sắp đầy' : 'Class IELTS 03 nearly full'}</div>
                <div className="text-slate-500 text-[11px]">{language === 'vi' ? 'Sĩ số hiện tại: 28/30' : 'Current count: 28/30'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{language === 'vi' ? '15 phút trước' : '15 mins ago'}</div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0 mt-0.5">
                <Gift className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{language === 'vi' ? 'Sinh nhật giáo viên' : 'Teacher Birthday'}</div>
                <div className="text-slate-500 text-[11px]">Phạm Thị Hằng (20/05)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{language === 'vi' ? '1 giờ trước' : '1 hour ago'}</div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0 mt-0.5">
                <Cloud className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{language === 'vi' ? 'Backup dữ liệu tuần' : 'Weekly Data Backup'}</div>
                <div className="text-slate-500 text-[11px]">{language === 'vi' ? 'Đã gửi về email admin' : 'Sent to admin email'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{language === 'vi' ? '2 giờ trước' : '2 hours ago'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 4: STUDENT LIST TABLE & WEEKLY TIMETABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Danh sách học sinh */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">{t('dashboard.student_list')}</h3>
            <button
              onClick={() => onNavigateTab('students')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> {t('dashboard.add_student')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2">{t('dashboard.code')}</th>
                  <th className="py-2 px-2">{t('dashboard.name')}</th>
                  <th className="py-2 px-2">{t('dashboard.class')}</th>
                  <th className="py-2 px-2">{t('dashboard.program')}</th>
                  <th className="py-2 px-2">{t('dashboard.phone')}</th>
                  <th className="py-2 px-2">{t('dashboard.status')}</th>
                  <th className="py-2 px-2">{t('dashboard.debt')}</th>
                  <th className="py-2 px-2 text-center">{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentRows.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-medium text-slate-800">{row.code}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-2.5 px-2">{row.classCode}</td>
                    <td className="py-2.5 px-2">{row.program}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-600">{row.phone}</td>
                    <td className="py-2.5 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Đang học'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {row.status === 'Đang học' ? t('actions.active') : t('actions.dropped')}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-bold text-slate-800">{row.debt}</td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <button className="hover:text-slate-700"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button className="hover:text-slate-700"><MoreVertical className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 rounded-md bg-red-600 text-white font-bold text-[11px] flex items-center justify-center">1</button>
              <button className="w-6 h-6 rounded-md hover:bg-slate-100 font-semibold text-[11px] flex items-center justify-center">2</button>
              <button className="w-6 h-6 rounded-md hover:bg-slate-100 font-semibold text-[11px] flex items-center justify-center">3</button>
              <span className="px-1">...</span>
              <button className="w-6 h-6 rounded-md hover:bg-slate-100 font-semibold text-[11px] flex items-center justify-center">8</button>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none">
              <option>10 / trang</option>
              <option>20 / trang</option>
              <option>50 / trang</option>
            </select>
          </div>
        </div>

        {/* Right: Thời khóa biểu */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Thời khóa biểu <span className="font-normal text-slate-500">(Tuần 13/05 - 19/05/2024)</span></h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button className="p-1 hover:bg-white rounded-md text-slate-600"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:bg-white rounded-md text-slate-600"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
              <select className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700">
                <option>Tuần</option>
                <option>Tháng</option>
              </select>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm lịch
              </button>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-1.5 font-bold">Thời gian</th>
                  <th className="p-1.5 font-bold">Thứ 2<br/><span className="font-normal text-slate-400">13/05</span></th>
                  <th className="p-1.5 font-bold">Thứ 3<br/><span className="font-normal text-slate-400">14/05</span></th>
                  <th className="p-1.5 font-bold">Thứ 4<br/><span className="font-normal text-slate-400">15/05</span></th>
                  <th className="p-1.5 font-bold">Thứ 5<br/><span className="font-normal text-slate-400">16/05</span></th>
                  <th className="p-1.5 font-bold">Thứ 6<br/><span className="font-normal text-slate-400">17/05</span></th>
                  <th className="p-1.5 font-bold">Thứ 7<br/><span className="font-normal text-slate-400">18/05</span></th>
                  <th className="p-1.5 font-bold">CN<br/><span className="font-normal text-slate-400">19/05</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-1.5 font-semibold text-slate-500 bg-slate-50/50">07:30</td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                </tr>
                <tr>
                  <td className="p-1.5 font-semibold text-slate-500 bg-slate-50/50">09:30</td>
                  <td className="p-1">
                    <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-1 rounded-md text-[9px] font-semibold">
                      Lớp 3A<br/>Cô Trang<br/>P.102
                    </div>
                  </td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1">
                    <div className="bg-purple-100 border border-purple-200 text-purple-800 p-1 rounded-md text-[9px] font-semibold">
                      IELTS 02<br/>Thầy Long<br/>P.201
                    </div>
                  </td>
                  <td className="p-1">
                    <div className="bg-amber-100 border border-amber-200 text-amber-800 p-1 rounded-md text-[9px] font-semibold">
                      Lớp 2B<br/>Thầy Nam<br/>P.102
                    </div>
                  </td>
                  <td className="p-1"></td>
                </tr>
                <tr>
                  <td className="p-1.5 font-semibold text-slate-500 bg-slate-50/50">13:30</td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1">
                    <div className="bg-rose-100 border border-rose-200 text-rose-800 p-1 rounded-md text-[9px] font-semibold">
                      Lớp 1A<br/>Cô Hằng<br/>P.101
                    </div>
                  </td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                </tr>
                <tr>
                  <td className="p-1.5 font-semibold text-slate-500 bg-slate-50/50">15:30</td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1">
                    <div className="bg-purple-100 border border-purple-200 text-purple-800 p-1 rounded-md text-[9px] font-semibold">
                      TOEIC 01<br/>Cô Hà<br/>P.201
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-1.5 font-semibold text-slate-500 bg-slate-50/50">17:30</td>
                  <td className="p-1">
                    <div className="bg-amber-100 border border-amber-200 text-amber-800 p-1 rounded-md text-[9px] font-semibold">
                      Lớp 4A<br/>Cô Hằng<br/>P.103
                    </div>
                  </td>
                  <td className="p-1"></td>
                  <td className="p-1">
                    <div className="bg-blue-100 border border-blue-200 text-blue-800 p-1 rounded-md text-[9px] font-semibold">
                      IELTS 01<br/>Thầy Long<br/>P.201
                    </div>
                  </td>
                  <td className="p-1"></td>
                  <td className="p-1">
                    <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-1 rounded-md text-[9px] font-semibold">
                      Lớp 5A<br/>Thầy Nam<br/>P.103
                    </div>
                  </td>
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Timetable Legend */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-slate-100 text-[10px]">
            <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tiểu học</span>
            <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> THCS</span>
            <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-amber-500"></span> THPT</span>
            <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-purple-500"></span> IELTS</span>
            <span className="flex items-center gap-1 font-medium text-slate-600"><span className="w-2 h-2 rounded-full bg-rose-500"></span> TOEIC</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 5: TUITION DEBT SUMMARY & 12 MONTH REVENUE BAR CHART */}
      {/* ------------------------------------------------------------- */}
      <div className={`grid grid-cols-1 ${showRevenue ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-4`}>
        {/* Left: Công nợ học phí */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Còn nợ học phí phải thu</h3>
            {!showDebt && (
              <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium border border-amber-200">
                Chế độ nhân viên thu phí
              </span>
            )}
          </div>

          {showDebt ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Box 1: Tổng phải thu */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Tổng phải thu</span>
                  <span className="text-xs font-extrabold text-slate-900">196.000.000đ</span>
                </div>
              </div>

              {/* Box 2: Đã thu */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Đã thu</span>
                  <span className="text-xs font-extrabold text-slate-900">174.200.000đ</span>
                </div>
              </div>

              {/* Box 3: Còn nợ */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Còn nợ</span>
                  <span className="text-xs font-extrabold text-slate-900">21.800.000đ</span>
                </div>
              </div>

              {/* Box 4: Tỷ lệ thu */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Tỷ lệ thu</span>
                  <span className="text-xs font-extrabold text-slate-900">88.9%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Tổng tiền công nợ học phí cần thu: <span className="text-red-700 text-sm font-extrabold">21.800.000đ</span></div>
                  <div className="text-[11px] text-slate-500 mt-0.5">32 học sinh đang còn nợ học phí cần liên hệ thu phí.</div>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('tuition')}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-end sm:self-auto"
              >
                Mở Quản Lý Thu Học Phí
              </button>
            </div>
          )}
        </div>

        {/* Right: Doanh thu 12 tháng gần nhất */}
        {showRevenue && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Doanh thu 12 tháng gần nhất</h3>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue12MonthsData}>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(val) => `${val}M`} />
                  <Tooltip formatter={(val) => [`${val}M VNĐ`, 'Doanh thu']} />
                  <Bar dataKey="amount" fill="#DC2626" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
