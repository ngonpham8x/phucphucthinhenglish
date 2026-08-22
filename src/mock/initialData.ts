import {
  Student,
  CourseProgram,
  Teacher,
  Room,
  ClassRoom,
  TimetableSlot,
  Grade,
  TuitionReceipt,
  ActivityLog,
  SystemBackup,
  CenterSettings
} from '../types';

export const initialSettings: CenterSettings = {
  name: "TRUNG TÂM ANH NGỮ PHÚC PHÚC THỊNH",
  slogan: "Nâng Tầm Tri Thức - Vững Bước Tương Lai",
  address: "Số 19, Đường số 29, Ninh An, phường Bình Minh, tỉnh Tây Ninh",
  phone: "0936 885 768",
  email: "contact@phucphucthinh.edu.vn",
  adminReportEmail: "",
  autoEmailReport: false,
  autoBackup: true,
  sheetsConfig: {
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    sheetName: "PhucPhucThinh_MasterData",
    autoSync: true,
    syncInterval: "daily",
    lastSync: "2026-08-09 08:00",
    connected: true
  }
};

export const initialPrograms: CourseProgram[] = [
  { id: "PROG00", code: "ENG-PRE", name: "Anh Văn Mầm Non (Kindergarten)", category: "Khác", tuitionFee: 2200000, description: "Phát triển tư duy Tiếng Anh tự nhiên từ sớm cho bé 3-5 tuổi" },
  { id: "PROG01", code: "ENG-C1", name: "Tiếng Anh Cấp 1 (Tiểu Học)", category: "Cấp 1", tuitionFee: 2500000, description: "Phát triển phản xạ nghe nói & từ vựng tiểu học" },
  { id: "PROG02", code: "ENG-C2", name: "Tiếng Anh Cấp 2 (THCS)", category: "Cấp 2", tuitionFee: 3200000, description: "Củng cố ngữ pháp, giao tiếp & chuẩn bị thi chuyên" },
  { id: "PROG03", code: "ENG-C3", name: "Tiếng Anh Cấp 3 (THPT)", category: "Cấp 3", tuitionFee: 3800000, description: "Luyện thi THPT Quốc Gia & Tốt nghiệp" },
  { id: "PROG04", code: "CAM-FLY", name: "Cambridge (Starters/Movers/Flyers)", category: "Cambridge", tuitionFee: 3500000, description: "Luyện thi chứng chỉ quốc tế Cambridge cho học sinh" },
  { id: "PROG05", code: "IELTS-AC", name: "IELTS Academic 6.5+", category: "IELTS", tuitionFee: 6500000, description: "Khóa luyện thi IELTS chuyên sâu 4 kỹ năng" },
  { id: "PROG06", code: "TOEIC-INT", name: "TOEIC 650+ Giao Tiếp & Công Việc", category: "TOEIC", tuitionFee: 4200000, description: "Dành cho sinh viên & người đi làm" },
  { id: "PROG07", code: "TOEFL-IBT", name: "TOEFL iBT Chuyên Sâu", category: "TOEFL", tuitionFee: 5800000, description: "Dành cho du học sinh và xét tuyển đại học" },
  { id: "PROG08", code: "MATH-VIE", name: "Lớp Toán & Tiếng Việt", category: "Cấp 1", tuitionFee: 2200000, description: "Củng cố & nâng cao kiến thức Toán & Tiếng Việt bám sát chương trình phổ thông" }
];

export const initialTeachers: Teacher[] = [
  {
    id: "GV001",
    name: "Thầy Mark Harrison",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    phone: "0912 345 678",
    email: "mark.harrison@phucphucthinh.edu.vn",
    address: "Chung cư Tây Ninh City, P.3, TP. Tây Ninh",
    specialty: "IELTS Academic 8.5 & Cambridge Flyers",
    assignedClassIds: ["CLASS01", "CLASS03"],
    scheduleNotes: "Giảng dạy Ca Tối T2-T4-T6",
    notes: "Giáo viên bản ngữ kinh nghiệm 8 năm"
  },
  {
    id: "GV002",
    name: "Cô Nguyễn Trần Thu Hà",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    phone: "0987 654 321",
    email: "thuha.nguyen@phucphucthinh.edu.vn",
    address: "Số 45 Đường Phạm Văn Đồng, TP. Tây Ninh",
    specialty: "Tiếng Anh Cấp 1 & Cấp 2, Cambridge Starters",
    assignedClassIds: ["CLASS02"],
    scheduleNotes: "Giảng dạy Ca Chiều T3-T5-T7",
    notes: "Cử nhân Ngôn Ngữ Anh - ĐH Sư Phạm"
  },
  {
    id: "GV003",
    name: "Thầy Lê Hoàng Nam",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "0903 112 233",
    email: "hoangnam.le@phucphucthinh.edu.vn",
    address: "Khu phố 2, Phường 2, TP. Tây Ninh",
    specialty: "TOEIC 900+ & Tiếng Anh Cấp 3",
    assignedClassIds: ["CLASS04", "CLASS05"],
    scheduleNotes: "Giảng dạy Ca Tối T3-T5-T7 & Chủ Nhật",
    notes: "Thạc sĩ Giảng dạy Tiếng Anh (TESOL)"
  }
];

export const initialRooms: Room[] = [
  { id: "P101", name: "Phòng P101 (Tầng 1)", capacity: 25, status: "available", notes: "Trang bị Tivi 65 inch & Máy lạnh" },
  { id: "P102", name: "Phòng P102 (Tầng 1)", capacity: 20, status: "available", notes: "Phòng học nhóm & Bảng tương tác" },
  { id: "P201", name: "Phòng Lab P201 (Tầng 2)", capacity: 18, status: "available", notes: "Phòng máy tính luyện thi IELTS Listening/Reading" },
  { id: "P202", name: "Phòng VIP P202 (Tầng 2)", capacity: 12, status: "available", notes: "Dành cho các lớp IELTS/TOEFL sĩ số nhỏ" }
];

export const initialClasses: ClassRoom[] = [
  {
    id: "CLASS01",
    code: "IELTS-65A",
    name: "Lớp IELTS Academic 6.5+ (K01)",
    programId: "PROG05",
    teacherId: "GV001",
    roomId: "P202",
    scheduleTime: "18:00 - 19:30",
    days: ["Thứ 2", "Thứ 4", "Thứ 6"],
    capacity: 12,
    studentIds: ["HS001", "HS002", "HS006"]
  },
  {
    id: "CLASS02",
    code: "CAM-FLY1",
    name: "Lớp Cambridge Flyers B1",
    programId: "PROG04",
    teacherId: "GV002",
    roomId: "P101",
    scheduleTime: "17:30 - 19:00",
    days: ["Thứ 3", "Thứ 5", "Thứ 7"],
    capacity: 20,
    studentIds: ["HS003", "HS004"]
  },
  {
    id: "CLASS03",
    code: "ENG-C2-01",
    name: "Tiếng Anh Cấp 2 Lớp 8-9",
    programId: "PROG02",
    teacherId: "GV001",
    roomId: "P102",
    scheduleTime: "19:30 - 21:00",
    days: ["Thứ 2", "Thứ 4", "Thứ 6"],
    capacity: 20,
    studentIds: ["HS005"]
  },
  {
    id: "CLASS04",
    code: "TOEIC-650",
    name: "TOEIC 650+ Chuyên Sâu",
    programId: "PROG06",
    teacherId: "GV003",
    roomId: "P201",
    scheduleTime: "18:00 - 19:30",
    days: ["Thứ 3", "Thứ 5", "Thứ 7"],
    capacity: 18,
    studentIds: ["HS007"]
  },
  {
    id: "CLASS05",
    code: "ENG-C3-01",
    name: "Luyện Thi THPT QG Tiếng Anh",
    programId: "PROG03",
    teacherId: "GV003",
    roomId: "P101",
    scheduleTime: "19:30 - 21:00",
    days: ["Thứ 3", "Thứ 5", "Thứ 7"],
    capacity: 25,
    studentIds: ["HS008"]
  },
  {
    id: "CLASS06",
    code: "TV3-IGC",
    name: "Lớp Toán & Tiếng Việt Lớp 3 (Trường QT IGC)",
    programId: "PROG08",
    teacherId: "GV002",
    roomId: "P102",
    scheduleTime: "17:30 - 19:00",
    days: ["Thứ 2", "Thứ 4", "Thứ 6"],
    capacity: 20,
    studentIds: ["HS010"]
  },
  {
    id: "CLASS07",
    code: "ENG12-HLK",
    name: "Lớp Tiếng Anh 12 - Global Success (Chuyên Hoàng Lê Kha)",
    programId: "PROG09",
    teacherId: "GV003",
    roomId: "P101",
    scheduleTime: "19:00 - 21:00 (T2) & 13:00 - 15:00 (CN)",
    days: ["Thứ 2", "Chủ Nhật"],
    capacity: 25,
    studentIds: ["HS009"]
  }
];

export const initialStudents: Student[] = [
  {
    id: "HS001",
    code: "HS001",
    name: "Nguyễn Minh Anh",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    dob: "2008-05-14",
    gender: "Nữ",
    school: "THPT Chuyên Hoàng Lê Kha",
    gradeLevel: "Khối 11",
    programId: "PROG05",
    classId: "CLASS01",
    address: "Số 12 Đường Bời Lời, P. Gia Lộc, TP. Tây Ninh",
    email: "minhanh.nguyen@gmail.com",
    phone: "0933 111 222",
    parentName: "Nguyễn Văn Hùng",
    parentPhone: "0918 222 333",
    enrollDate: "2026-01-10",
    notes: "Mục tiêu đạt IELTS 7.0 thi đại học",
    status: "active",
    feeStatus: "paid"
  },
  {
    id: "HS002",
    code: "HS002",
    name: "Trần Quốc Bảo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    dob: "2008-09-20",
    gender: "Nam",
    school: "THPT Tây Ninh",
    gradeLevel: "Khối 11",
    programId: "PROG05",
    classId: "CLASS01",
    address: "Khu phố 1, Phường 3, TP. Tây Ninh",
    email: "quocbao.tran@gmail.com",
    phone: "0944 333 444",
    parentName: "Trần Thị Lan",
    parentPhone: "0908 444 555",
    enrollDate: "2026-01-15",
    notes: "Thế mạnh Kỹ năng Reading, cần luyện Speaking",
    status: "active",
    feeStatus: "debt"
  },
  {
    id: "HS003",
    code: "HS003",
    name: "Lê Ngọc Khánh Chi",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    dob: "2014-03-12",
    gender: "Nữ",
    school: "Tiểu học Kim Đồng",
    gradeLevel: "Khối 5",
    programId: "PROG04",
    classId: "CLASS02",
    address: "Đường Trương Tùng Quân, P.3, TP. Tây Ninh",
    email: "khanhchi.le@gmail.com",
    phone: "0977 555 666",
    parentName: "Lê Minh Tuấn",
    parentPhone: "0988 777 888",
    enrollDate: "2026-02-01",
    notes: "Chăm chỉ, hăng hái phát biểu",
    status: "active",
    feeStatus: "paid"
  },
  {
    id: "HS004",
    code: "HS004",
    name: "Phạm Đăng Khoa",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    dob: "2014-11-05",
    gender: "Nam",
    school: "Tiểu học Võ Thị Sáu",
    gradeLevel: "Khối 5",
    programId: "PROG04",
    classId: "CLASS02",
    address: "Ấp Ninh Trung, Xã Ninh Sơn, TP. Tây Ninh",
    email: "dangkhoa.pham@gmail.com",
    phone: "0966 888 999",
    parentName: "Phạm Văn Đức",
    parentPhone: "0938 999 000",
    enrollDate: "2026-02-05",
    notes: "Có khiếu phát âm tốt",
    status: "active",
    feeStatus: "paid"
  },
  {
    id: "HS005",
    code: "HS005",
    name: "Hoàng Vũ Thái Sơn",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    dob: "2011-07-18",
    gender: "Nam",
    school: "THCS Chu Văn An",
    gradeLevel: "Khối 8",
    programId: "PROG02",
    classId: "CLASS03",
    address: "Số 88 Đường Cách Mạng Tháng 8, P.1, TP. Tây Ninh",
    email: "thaison.hoang@gmail.com",
    phone: "0912 000 111",
    parentName: "Hoàng Nam Phong",
    parentPhone: "0903 111 222",
    enrollDate: "2026-02-10",
    notes: "Xin bảo lưu 2 tuần do thi học kỳ ở trường",
    status: "reserved",
    feeStatus: "paid"
  },
  {
    id: "HS006",
    code: "HS006",
    name: "Đặng Thảo Nguyên",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    dob: "2008-02-28",
    gender: "Nữ",
    school: "THPT Chuyên Hoàng Lê Kha",
    gradeLevel: "Khối 11",
    programId: "PROG05",
    classId: "CLASS01",
    address: "Khu phố 4, Phường 1, TP. Tây Ninh",
    email: "thaonguyen.dang@gmail.com",
    phone: "0922 222 333",
    parentName: "Đặng Văn Tiến",
    parentPhone: "0919 333 444",
    enrollDate: "2026-01-20",
    notes: "Điểm thi thử IELTS Listening 7.5",
    status: "active",
    feeStatus: "paid"
  },
  {
    id: "HS007",
    code: "HS007",
    name: "Bùi Thị Phương Thảo",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    dob: "2003-08-15",
    gender: "Nữ",
    school: "Đại học Hồng Bàng (Cơ sở Tây Ninh)",
    gradeLevel: "Sinh viên",
    programId: "PROG06",
    classId: "CLASS04",
    address: "Ấp Bình Linh, Xã Chà Là, H. Dương Minh Châu",
    email: "phuongthao.bui@gmail.com",
    phone: "0955 444 555",
    parentName: "Bùi Văn Khải",
    parentPhone: "0902 555 666",
    enrollDate: "2026-02-12",
    notes: "Cần bằng TOEIC ra trường",
    status: "active",
    feeStatus: "debt"
  },
  {
    id: "HS008",
    code: "HS008",
    name: "Vũ Minh Triết",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    dob: "2007-12-01",
    gender: "Nam",
    school: "THPT Trần Đại Nghĩa",
    gradeLevel: "Khối 12",
    programId: "PROG03",
    classId: "CLASS05",
    address: "Số 56 Đường 30/4, P.2, TP. Tây Ninh",
    email: "minhtriet.vu@gmail.com",
    phone: "0988 666 777",
    parentName: "Vũ Thanh Sơn",
    parentPhone: "0913 777 888",
    enrollDate: "2026-01-08",
    notes: "Luyện thi đại học môn Tiếng Anh",
    status: "active",
    feeStatus: "paid"
  },
  {
    id: "HS009",
    code: "HS009",
    name: "Lê Hoàng Phúc",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    dob: "2007-04-18",
    gender: "Nam",
    school: "THPT Chuyên Hoàng Lê Kha",
    gradeLevel: "Khối 12",
    programId: "PROG09",
    classId: "CLASS07",
    address: "Số 19, Đường số 29, Ninh An, P. Bình Minh, Tây Ninh",
    email: "hoangphuc.le@gmail.com",
    phone: "0936 123 456",
    parentName: "Lê Văn Hưng",
    parentPhone: "0936 885 768",
    enrollDate: "2026-02-01",
    notes: "Học sinh Lớp Tiếng Anh 12 - Global Success (THPT Chuyên Hoàng Lê Kha)",
    status: "active",
    feeStatus: "paid"
  },
  {
    id: "HS010",
    code: "HS010",
    name: "Nguyễn Khánh Ngọc",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    dob: "2016-08-22",
    gender: "Nữ",
    school: "Trường Quốc Tế IGC Tây Ninh",
    gradeLevel: "Khối 3",
    programId: "PROG08",
    classId: "CLASS06",
    address: "Số 19, Đường số 29, Ninh An, P. Bình Minh, Tây Ninh",
    email: "khanhngoc.nguyen@gmail.com",
    phone: "0936 987 654",
    parentName: "Nguyễn Thị Kim Thanh",
    parentPhone: "0936 885 768",
    enrollDate: "2026-02-05",
    notes: "Được ưu đãi giảm 10% học phí lớp Toán & Tiếng Việt Lớp 3",
    status: "active",
    feeStatus: "paid"
  }
];

export const initialTimetableSlots: TimetableSlot[] = [
  { id: "TT01", classId: "CLASS01", teacherId: "GV001", roomId: "P202", dayOfWeek: "Thứ 2", startTime: "18:00", endTime: "19:30" },
  { id: "TT02", classId: "CLASS01", teacherId: "GV001", roomId: "P202", dayOfWeek: "Thứ 4", startTime: "18:00", endTime: "19:30" },
  { id: "TT03", classId: "CLASS01", teacherId: "GV001", roomId: "P202", dayOfWeek: "Thứ 6", startTime: "18:00", endTime: "19:30" },
  { id: "TT04", classId: "CLASS02", teacherId: "GV002", roomId: "P101", dayOfWeek: "Thứ 3", startTime: "17:30", endTime: "19:00" },
  { id: "TT05", classId: "CLASS02", teacherId: "GV002", roomId: "P101", dayOfWeek: "Thứ 5", startTime: "17:30", endTime: "19:00" },
  { id: "TT06", classId: "CLASS02", teacherId: "GV002", roomId: "P101", dayOfWeek: "Thứ 7", startTime: "17:30", endTime: "19:00" },
  { id: "TT07", classId: "CLASS03", teacherId: "GV001", roomId: "P102", dayOfWeek: "Thứ 2", startTime: "19:30", endTime: "21:00" },
  { id: "TT08", classId: "CLASS03", teacherId: "GV001", roomId: "P102", dayOfWeek: "Thứ 4", startTime: "19:30", endTime: "21:00" },
  { id: "TT09", classId: "CLASS03", teacherId: "GV001", roomId: "P102", dayOfWeek: "Thứ 6", startTime: "19:30", endTime: "21:00" },
  { id: "TT10", classId: "CLASS04", teacherId: "GV003", roomId: "P201", dayOfWeek: "Thứ 3", startTime: "18:00", endTime: "19:30" },
  { id: "TT11", classId: "CLASS04", teacherId: "GV003", roomId: "P201", dayOfWeek: "Thứ 5", startTime: "18:00", endTime: "19:30" },
  { id: "TT12", classId: "CLASS04", teacherId: "GV003", roomId: "P201", dayOfWeek: "Thứ 7", startTime: "18:00", endTime: "19:30" },
  { id: "TT13", classId: "CLASS05", teacherId: "GV003", roomId: "P101", dayOfWeek: "Thứ 3", startTime: "19:30", endTime: "21:00" },
  { id: "TT14", classId: "CLASS05", teacherId: "GV003", roomId: "P101", dayOfWeek: "Thứ 5", startTime: "19:30", endTime: "21:00" },
  { id: "TT15", classId: "CLASS05", teacherId: "GV003", roomId: "P101", dayOfWeek: "Thứ 7", startTime: "19:30", endTime: "21:00" }
];

export const initialGrades: Grade[] = [
  { id: "G01", studentId: "HS001", classId: "CLASS01", listening: 8.5, speaking: 7.5, reading: 8.0, writing: 7.0, midterm: 8.0, finalExam: 8.5, attendance: 10, average: 8.1 },
  { id: "G02", studentId: "HS002", classId: "CLASS01", listening: 7.0, speaking: 6.0, reading: 7.5, writing: 6.5, midterm: 6.8, finalExam: 7.2, attendance: 9.5, average: 7.0 },
  { id: "G03", studentId: "HS003", classId: "CLASS02", listening: 9.0, speaking: 8.5, reading: 8.5, writing: 8.0, midterm: 8.5, finalExam: 9.0, attendance: 10, average: 8.7 },
  { id: "G04", studentId: "HS004", classId: "CLASS02", listening: 8.0, speaking: 8.0, reading: 7.5, writing: 7.0, midterm: 7.5, finalExam: 8.0, attendance: 9.5, average: 7.7 },
  { id: "G05", studentId: "HS005", classId: "CLASS03", listening: 7.5, speaking: 7.0, reading: 7.0, writing: 6.5, midterm: 7.0, finalExam: 7.5, attendance: 9.0, average: 7.3 },
  { id: "G06", studentId: "HS006", classId: "CLASS01", listening: 8.0, speaking: 8.0, reading: 8.5, writing: 7.5, midterm: 8.0, finalExam: 8.2, attendance: 10, average: 8.2 },
  { id: "G07", studentId: "HS007", classId: "CLASS04", listening: 6.5, speaking: 6.5, reading: 7.0, writing: 6.0, midterm: 6.5, finalExam: 6.8, attendance: 8.5, average: 6.6 },
  { id: "G08", studentId: "HS008", classId: "CLASS05", listening: 8.5, speaking: 8.0, reading: 8.5, writing: 8.0, midterm: 8.2, finalExam: 8.6, attendance: 10, average: 8.4 }
];

export const initialTuitionReceipts: TuitionReceipt[] = [
  {
    id: "TR001",
    code: "PT-2026-001",
    studentId: "HS001",
    classId: "CLASS01",
    courseFee: 6500000,
    discount: 500000,
    paidAmount: 6000000,
    debtAmount: 0,
    paymentDate: "2026-01-10",
    collectorName: "Nguyễn Thị Mai",
    paymentMethod: "Chuyển khoản",
    notes: "Đã hoàn thành học phí khóa IELTS Academic"
  },
  {
    id: "TR002",
    code: "PT-2026-002",
    studentId: "HS002",
    classId: "CLASS01",
    courseFee: 6500000,
    discount: 0,
    paidAmount: 3500000,
    debtAmount: 3000000,
    paymentDate: "2026-01-15",
    collectorName: "Nguyễn Thị Mai",
    paymentMethod: "Tiền mặt",
    notes: "Đóng đợt 1 - Hẹn đóng nợ trước 28/02"
  },
  {
    id: "TR003",
    code: "PT-2026-003",
    studentId: "HS003",
    classId: "CLASS02",
    courseFee: 3500000,
    discount: 300000,
    paidAmount: 3200000,
    debtAmount: 0,
    paymentDate: "2026-02-01",
    collectorName: "Phúc Phúc Thịnh (Chủ Cơ Sở)",
    paymentMethod: "Chuyển khoản",
    notes: "Ưu đãi đăng ký nhóm bạn"
  },
  {
    id: "TR004",
    code: "PT-2026-004",
    studentId: "HS004",
    classId: "CLASS02",
    courseFee: 3500000,
    discount: 0,
    paidAmount: 3500000,
    debtAmount: 0,
    paymentDate: "2026-02-05",
    collectorName: "Nguyễn Thị Mai",
    paymentMethod: "Tiền mặt",
    notes: "Đã thu đủ"
  },
  {
    id: "TR005",
    code: "PT-2026-005",
    studentId: "HS007",
    classId: "CLASS04",
    courseFee: 4200000,
    discount: 200000,
    paidAmount: 2000000,
    debtAmount: 2000000,
    paymentDate: "2026-02-12",
    collectorName: "Nguyễn Thị Mai",
    paymentMethod: "Chuyển khoản",
    notes: "Đóng đợt 1 - Nợ đợt 2"
  },
  {
    id: "TR006",
    code: "PT-2026-006",
    studentId: "HS008",
    classId: "CLASS05",
    courseFee: 3800000,
    discount: 300000,
    paidAmount: 3500000,
    debtAmount: 0,
    paymentDate: "2026-01-08",
    collectorName: "Phúc Phúc Thịnh (Chủ Cơ Sở)",
    paymentMethod: "Chuyển khoản",
    notes: "Khóa luyện thi THPT QG"
  }
];

export const initialBackups: SystemBackup[] = [
  {
    id: "BK001",
    filename: "PhucPhucThinh_Backup_20260809_Daily.zip",
    timestamp: "2026-08-09 00:00:00",
    sizeKb: 1420,
    type: "Tự động Hằng Ngày",
    status: "Thành công"
  },
  {
    id: "BK002",
    filename: "PhucPhucThinh_Backup_20260803_Weekly.zip",
    timestamp: "2026-08-03 00:00:00",
    sizeKb: 1380,
    type: "Tự động Hằng Tuần",
    status: "Thành công"
  },
  {
    id: "BK003",
    filename: "PhucPhucThinh_Manual_20260801.json",
    timestamp: "2026-08-01 14:30:15",
    sizeKb: 850,
    type: "Thủ công",
    status: "Thành công"
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: "LOG001",
    timestamp: "2026-08-09 22:45:10",
    userEmail: "",
    userName: "Phúc Phúc Thịnh (Chủ Cơ Sở)",
    action: "ĐĂNG NHẬP",
    module: "Xác thực",
    details: "Đăng nhập thành công qua Google OAuth"
  },
  {
    id: "LOG002",
    timestamp: "2026-08-09 21:10:00",
    userEmail: "nhanvien.mai@phucphucthinh.edu.vn",
    userName: "Nguyễn Thị Mai (Quản Lý)",
    action: "THÊM",
    module: "Học phí",
    details: "Tạo phiếu thu PT-2026-005 cho học sinh Bùi Thị Phương Thảo (2,000,000 đ)"
  },
  {
    id: "LOG003",
    timestamp: "2026-08-09 18:30:00",
    userEmail: "",
    userName: "Phúc Phúc Thịnh (Chủ Cơ Sở)",
    action: "ĐỒNG BỘ",
    module: "Google Sheets",
    details: "Đồng bộ tự động 8 học sinh, 3 giáo viên, 5 lớp học lên Google Sheets"
  },
  {
    id: "LOG004",
    timestamp: "2026-08-08 09:15:00",
    userEmail: "nhanvien.mai@phucphucthinh.edu.vn",
    userName: "Nguyễn Thị Mai (Quản Lý)",
    action: "SỬA",
    module: "Học sinh",
    details: "Cập nhật thông tin phụ huynh cho học sinh Nguyễn Minh Anh (HS001)"
  },
  {
    id: "LOG005",
    timestamp: "2026-08-07 16:00:00",
    userEmail: "",
    userName: "Phúc Phúc Thịnh (Chủ Cơ Sở)",
    action: "EXPORT",
    module: "Excel",
    details: "Xuất file Excel Tổng hợp học sinh & Lớp học với 6 worksheets"
  }
];
