import ExcelJS from 'exceljs';
import { Student, ClassRoom, Teacher, TuitionReceipt, Grade } from '../types';

export interface ExcelExportData {
  centerName: string;
  students: Student[];
  classes: ClassRoom[];
  teachers: Teacher[];
  receipts: TuitionReceipt[];
  grades: Grade[];
}

export async function generateMasterExcelWorkbook(data: ExcelExportData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.centerName;
  workbook.created = new Date();

  // Branding Color Palette
  const PRIMARY_COLOR = '8E0032';  // Deep red branding
  const ACCENT_COLOR = 'C62828';   // Vibrant red
  const HEADER_FILL = '991B1B';    // Table header dark red
  const LIGHT_ROW_FILL = 'FEF2F2'; // Subtle red zebra row
  const BORDER_COLOR = 'CBD5E1';   // Clean border slate
  const LINK_COLOR = '1D4ED8';     // Deep blue for hyperlinks

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } }
  };

  // Helper for applying standard styling to back-links
  const applyBackLink = (sheet: ExcelJS.Worksheet) => {
    sheet.mergeCells('A3:I3');
    const backCell = sheet.getCell('A3');
    backCell.value = { text: '← QUAY VỀ TRANG TỔNG HỢP HỆ THỐNG', hyperlink: "#'TỔNG HỢP'!A1" };
    backCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: LINK_COLOR }, underline: true };
    backCell.alignment = { horizontal: 'left', vertical: 'middle' };
  };

  // =============================================================
  // SHEET 1: TỔNG HỢP (SUMMARY DASHBOARD & MENU DIRECTORY)
  // =============================================================
  const summarySheet = workbook.addWorksheet('TỔNG HỢP');

  // Title Banner (Rows 1-2)
  summarySheet.mergeCells('A1:H2');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `${data.centerName.toUpperCase()}\nBÁO CÁO TỔNG HỢP TOÀN BỘ HỆ THỐNG QUẢN LÝ`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Subtitle / Date (Row 3)
  summarySheet.mergeCells('A3:H3');
  const dateCell = summarySheet.getCell('A3');
  dateCell.value = `Thời gian xuất file: ${new Date().toLocaleString('vi-VN')} | Đã liên kết công thức tự động toàn bộ sub-sheets`;
  dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } };
  dateCell.alignment = { horizontal: 'center' };

  // -------------------------------------------------------------
  // SECTION I: DANH MỤC MENU HỆ THỐNG & ĐƯỜNG DẪN LIÊN KẾT
  // -------------------------------------------------------------
  summarySheet.mergeCells('A5:H5');
  const navHeader = summarySheet.getCell('A5');
  navHeader.value = 'I. DANH MỤC MENU HỆ THỐNG & CHUYỂN TRANG LIÊN KẾT';
  navHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: PRIMARY_COLOR } };

  const navTableHeader = summarySheet.addRow(['STT', 'Tên Danh Mục Menu', 'Tổng Số Lượng (Công Thức)', 'Mô Tả Chức Năng', 'Đường Dẫn Sheet Chuyên Sâu', '', '', '']);
  summarySheet.mergeCells('E6:H6');
  navTableHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  navTableHeader.eachCell((cell, colIdx) => {
    if (colIdx <= 5) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    }
  });

  const menuItems = [
    { stt: 1, name: 'Học Sinh (Students)', formula: "COUNTA('HỌC SINH'!B6:B1000)", desc: 'Quản lý thông tin học sinh, phụ huynh, địa chỉ', sheetTarget: 'HỌC SINH' },
    { stt: 2, name: 'Giáo Viên (Teachers)', formula: "COUNTA('GIÁO VIÊN'!B6:B1000)", desc: 'Danh sách giáo viên, chuyên môn, số điện thoại', sheetTarget: 'GIÁO VIÊN' },
    { stt: 3, name: 'Lớp Học (Classes)', formula: "COUNTA('LỚP HỌC'!B6:B1000)", desc: 'Quản lý danh sách lớp học, phòng học, sĩ số', sheetTarget: 'LỚP HỌC' },
    { stt: 4, name: 'Học Phí & Phiếu Thu (Tuition)', formula: "COUNTA('HỌC PHÍ'!B6:B1000)", desc: 'Lịch sử thu học phí, dư nợ & phương thức', sheetTarget: 'HỌC PHÍ' },
    { stt: 5, name: 'Bảng Điểm & Học Lực (Grades)', formula: "COUNTA('BẢNG ĐIỂM'!B6:B1000)", desc: 'Kết quả học tập 4 kỹ năng & điểm trung bình', sheetTarget: 'BẢNG ĐIỂM' }
  ];

  menuItems.forEach((m, idx) => {
    const rIdx = 7 + idx;
    const row = summarySheet.addRow([
      m.stt,
      m.name,
      { formula: m.formula },
      m.desc,
      { text: `→ Đến Sheet ${m.sheetTarget}`, hyperlink: `#'${m.sheetTarget}'!A1` },
      '', '', ''
    ]);
    summarySheet.mergeCells(`E${rIdx}:H${rIdx}`);
    row.font = { name: 'Arial', size: 10 };
    row.eachCell((cell, colIdx) => {
      if (colIdx <= 5) cell.border = thinBorder;
    });

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
    row.getCell(5).font = { name: 'Arial', size: 10, bold: true, color: { argb: LINK_COLOR }, underline: true };
    row.getCell(5).alignment = { horizontal: 'center' };
  });

  // -------------------------------------------------------------
  // SECTION II: THỐNG KÊ TÀI CHÍNH & CHỈ SỐ HỆ THỐNG
  // -------------------------------------------------------------
  summarySheet.addRow([]); // Row 12 blank
  summarySheet.mergeCells('A13:H13');
  const kpiSecHeader = summarySheet.getCell('A13');
  kpiSecHeader.value = 'II. THỐNG KÊ TÀI CHÍNH & CHỈ SỐ HỆ THỐNG TOÀN TRƯỜNG';
  kpiSecHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: PRIMARY_COLOR } };

  const kpiTableHeader = summarySheet.addRow(['STT', 'Mục Chỉ Số Thống Kê', 'Giá Trị Công Thức Tự Động', 'Đơn Vị', 'Nguồn Tự Động Truy Xuất', '', '', '']);
  summarySheet.mergeCells('E14:H14');
  kpiTableHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  kpiTableHeader.eachCell((cell, colIdx) => {
    if (colIdx <= 5) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    }
  });

  const kpiList = [
    { stt: 1, name: 'Tổng Học Phí Đã Thu Toàn Trường', formula: "SUM('HỌC PHÍ'!F6:F1000)", fmt: '#,##0 "đ"', unit: 'VNĐ', source: "Tự động cộng cột 'Đã Thu' ở Sheet HỌC PHÍ" },
    { stt: 2, name: 'Tổng Công Nợ Học Phí Chưa Thu', formula: "SUM('HỌC PHÍ'!G6:G1000)", fmt: '#,##0 "đ"', unit: 'VNĐ', source: "Tự động cộng cột 'Còn Nợ' ở Sheet HỌC PHÍ" },
    { stt: 3, name: 'Điểm Trung Bình Toàn Hệ Thống', formula: "AVERAGE('BẢNG ĐIỂM'!H6:H1000)", fmt: '0.00', unit: 'Thang điểm 10', source: "Tự động tính trung bình cột 'Điểm TB' ở Sheet BẢNG ĐIỂM" }
  ];

  kpiList.forEach((k, idx) => {
    const rIdx = 15 + idx;
    const row = summarySheet.addRow([
      k.stt,
      k.name,
      { formula: k.formula },
      k.unit,
      k.source,
      '', '', ''
    ]);
    summarySheet.mergeCells(`E${rIdx}:H${rIdx}`);
    row.font = { name: 'Arial', size: 10 };
    row.eachCell((cell, colIdx) => {
      if (colIdx <= 5) cell.border = thinBorder;
    });

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
    row.getCell(3).numFmt = k.fmt;
    row.getCell(4).alignment = { horizontal: 'center' };
  });

  // -------------------------------------------------------------
  // SECTION III: BÁO CÁO CHI TIẾT TỪNG LỚP HỌC (CLASS BREAKDOWN)
  // -------------------------------------------------------------
  summarySheet.addRow([]); // Row 18 blank
  summarySheet.mergeCells('A19:H19');
  const classSecHeader = summarySheet.getCell('A19');
  classSecHeader.value = 'III. BÁO CÁO CHI TIẾT THEO TỪNG LỚP HỌC & CÔNG THỨC TRUY XUẤT SUB-SHEETS';
  classSecHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: PRIMARY_COLOR } };

  const classHeaderRow = summarySheet.addRow([
    'Mã Lớp',
    'Tên Lớp Học',
    'Giáo Viên Phụ Trách',
    'Sĩ Số (Học Sinh)',
    'Tổng Học Phí Thu (VNĐ)',
    'Tổng Công Nợ (VNĐ)',
    'Lịch Học',
    'Liên Kết Sheet Lớp'
  ]);

  classHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  classHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  const classStartRow = 21;
  data.classes.forEach((cls, idx) => {
    const sheetName = `Lớp ${cls.code}`;
    const teacher = data.teachers.find(t => t.id === cls.teacherId);
    const row = summarySheet.addRow([
      cls.code,
      cls.name,
      teacher ? teacher.name : 'Chưa phân công',
      { formula: `COUNTA('${sheetName}'!B6:B1000)` },
      { formula: `SUM('${sheetName}'!G6:G1000)` },
      { formula: `SUM('${sheetName}'!H6:H1000)` },
      `${cls.days.join(', ')} (${cls.scheduleTime})`,
      { text: `→ Sheet ${sheetName}`, hyperlink: `#'${sheetName}'!A1` }
    ]);

    row.font = { name: 'Arial', size: 10 };
    row.eachCell((cell) => { cell.border = thinBorder; });

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW_FILL } };
      });
    }

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(1).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(4).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(5).numFmt = '#,##0 "đ"';
    row.getCell(6).numFmt = '#,##0 "đ"';
    row.getCell(8).alignment = { horizontal: 'center' };
    row.getCell(8).font = { name: 'Arial', size: 10, bold: true, color: { argb: LINK_COLOR }, underline: true };
  });

  // Total Row for Class Breakdown Table
  const classEndRow = classStartRow + data.classes.length - 1;
  const classSumRow = summarySheet.addRow([
    'TỔNG CỘNG',
    '',
    '',
    { formula: `SUM(D${classStartRow}:D${classEndRow})` },
    { formula: `SUM(E${classStartRow}:E${classEndRow})` },
    { formula: `SUM(F${classStartRow}:F${classEndRow})` },
    '',
    ''
  ]);

  summarySheet.mergeCells(`A${classEndRow + 1}:C${classEndRow + 1}`);
  classSumRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
  classSumRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    cell.border = thinBorder;
  });

  classSumRow.getCell(4).alignment = { horizontal: 'center' };
  classSumRow.getCell(5).numFmt = '#,##0 "đ"';
  classSumRow.getCell(6).numFmt = '#,##0 "đ"';

  summarySheet.autoFilter = { from: 'A20', to: `H${classEndRow}` };
  summarySheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 20 }];

  summarySheet.columns = [
    { width: 14 },
    { width: 30 },
    { width: 24 },
    { width: 20 },
    { width: 26 },
    { width: 24 },
    { width: 28 },
    { width: 24 }
  ];


  // =============================================================
  // SUB-SHEET 1: HỌC SINH (MASTER STUDENT ROSTER)
  // =============================================================
  const studentSheet = workbook.addWorksheet('HỌC SINH');
  studentSheet.mergeCells('A1:K2');
  const stTitle = studentSheet.getCell('A1');
  stTitle.value = `${data.centerName.toUpperCase()}\nDANH SÁCH HỌC SINH TOÀN TRUNG TÂM`;
  stTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  stTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
  stTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  applyBackLink(studentSheet);
  studentSheet.addRow([]); // Row 4 blank

  const stHeader = studentSheet.addRow([
    'STT',
    'Mã Học Sinh',
    'Họ Và Tên',
    'Giới Tính',
    'Ngày Sinh',
    'Mã Lớp Học',
    'Số Điện Thoại',
    'Phụ Huynh & SĐT',
    'Địa Chỉ Thường Trú',
    'Trạng Thái Học',
    'Tình Trạng Học Phí'
  ]);
  stHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  stHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  data.students.forEach((st, idx) => {
    const cls = data.classes.find(c => c.id === st.classId);
    const row = studentSheet.addRow([
      idx + 1,
      st.code,
      st.name,
      st.gender,
      st.dob,
      cls ? cls.code : 'Chưa xếp lớp',
      st.phone || 'Chưa có',
      `${st.parentName} (${st.parentPhone})`,
      st.address || 'Tây Ninh',
      st.status === 'active' ? 'Đang học' : (st.status === 'reserved' ? 'Bảo lưu' : 'Nghỉ học'),
      st.feeStatus === 'paid' ? 'Đã hoàn thành' : (st.feeStatus === 'debt' ? 'Còn nợ học phí' : 'Chưa đóng')
    ]);
    row.font = { name: 'Arial', size: 10 };
    row.eachCell(cell => { cell.border = thinBorder; });
    if (idx % 2 === 1) {
      row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW_FILL } }; });
    }
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).alignment = { horizontal: 'center' };
    row.getCell(10).alignment = { horizontal: 'center' };
    row.getCell(11).alignment = { horizontal: 'center' };
  });

  const stTotalRowIdx = 5 + data.students.length + 1;
  const stSumRow = studentSheet.addRow([
    '',
    'TỔNG CỘNG',
    { formula: `IF(COUNTA(B6:B1000)>0, COUNTA(B6:B1000) & " Học sinh", "0 Học sinh")` },
    '', '', '', '', '', '', '', ''
  ]);
  stSumRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
  stSumRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    cell.border = thinBorder;
  });

  studentSheet.autoFilter = { from: 'A5', to: `K${stTotalRowIdx - 1}` };
  studentSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];
  studentSheet.columns = [
    { width: 8 }, { width: 14 }, { width: 24 }, { width: 12 }, { width: 14 },
    { width: 14 }, { width: 16 }, { width: 28 }, { width: 30 }, { width: 14 }, { width: 18 }
  ];


  // =============================================================
  // SUB-SHEET 2: GIÁO VIÊN (MASTER TEACHER ROSTER)
  // =============================================================
  const teacherSheet = workbook.addWorksheet('GIÁO VIÊN');
  teacherSheet.mergeCells('A1:H2');
  const tcTitle = teacherSheet.getCell('A1');
  tcTitle.value = `${data.centerName.toUpperCase()}\nDANH SÁCH GIÁO VIÊN & ĐỘI NGŨ TRỢ GIẢNG`;
  tcTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  tcTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
  tcTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  applyBackLink(teacherSheet);
  teacherSheet.addRow([]);

  const tcHeader = teacherSheet.addRow([
    'STT',
    'Mã Giáo Viên',
    'Họ Và Tên',
    'Chuyên Môn',
    'Số Điện Thoại',
    'Email Liên Hệ',
    'Địa Chỉ',
    'Số Lớp Phụ Trách (Công Thức)'
  ]);
  tcHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tcHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  data.teachers.forEach((tc, idx) => {
    const row = teacherSheet.addRow([
      idx + 1,
      `GV-${100 + idx + 1}`,
      tc.name,
      tc.specialty || 'Anh ngữ tổng quát',
      tc.phone,
      tc.email,
      tc.address || 'Tây Ninh',
      { formula: `COUNTIF('LỚP HỌC'!D6:D1000, "${tc.name}")` }
    ]);
    row.font = { name: 'Arial', size: 10 };
    row.eachCell(cell => { cell.border = thinBorder; });
    if (idx % 2 === 1) {
      row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW_FILL } }; });
    }
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(8).alignment = { horizontal: 'center' };
    row.getCell(8).font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
  });

  const tcTotalRowIdx = 5 + data.teachers.length + 1;
  const tcSumRow = teacherSheet.addRow([
    '',
    'TỔNG CỘNG',
    { formula: `IF(COUNTA(B6:B1000)>0, COUNTA(B6:B1000) & " Giáo viên", "0 Giáo viên")` },
    '', '', '', '', ''
  ]);
  tcSumRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
  tcSumRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    cell.border = thinBorder;
  });

  teacherSheet.autoFilter = { from: 'A5', to: `H${tcTotalRowIdx - 1}` };
  teacherSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];
  teacherSheet.columns = [
    { width: 8 }, { width: 16 }, { width: 24 }, { width: 22 },
    { width: 16 }, { width: 26 }, { width: 28 }, { width: 24 }
  ];


  // =============================================================
  // SUB-SHEET 3: LỚP HỌC (MASTER CLASS ROSTER)
  // =============================================================
  const classMasterSheet = workbook.addWorksheet('LỚP HỌC');
  classMasterSheet.mergeCells('A1:I2');
  const cmTitle = classMasterSheet.getCell('A1');
  cmTitle.value = `${data.centerName.toUpperCase()}\nDANH SÁCH LỚP HỌC & CHƯƠNG TRÌNH ĐÀO TẠO`;
  cmTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  cmTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
  cmTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  applyBackLink(classMasterSheet);
  classMasterSheet.addRow([]);

  const cmHeader = classMasterSheet.addRow([
    'STT',
    'Mã Lớp',
    'Tên Lớp Học',
    'Giáo Viên Phụ Trách',
    'Lịch Học',
    'Khung Giờ',
    'Phòng Học',
    'Sĩ Số Học Sinh (Công Thức)',
    'Liên Kết Sheet Chi Tiết'
  ]);
  cmHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  cmHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  data.classes.forEach((cls, idx) => {
    const sheetName = `Lớp ${cls.code}`;
    const teacher = data.teachers.find(t => t.id === cls.teacherId);
    const row = classMasterSheet.addRow([
      idx + 1,
      cls.code,
      cls.name,
      teacher ? teacher.name : 'Chưa phân công',
      cls.days.join(', '),
      cls.scheduleTime,
      cls.roomId,
      { formula: `COUNTA('${sheetName}'!B6:B1000)` },
      { text: `→ Sheet ${sheetName}`, hyperlink: `#'${sheetName}'!A1` }
    ]);
    row.font = { name: 'Arial', size: 10 };
    row.eachCell(cell => { cell.border = thinBorder; });
    if (idx % 2 === 1) {
      row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW_FILL } }; });
    }
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).alignment = { horizontal: 'center' };
    row.getCell(8).alignment = { horizontal: 'center' };
    row.getCell(8).font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
    row.getCell(9).alignment = { horizontal: 'center' };
    row.getCell(9).font = { name: 'Arial', size: 10, bold: true, color: { argb: LINK_COLOR }, underline: true };
  });

  const cmTotalRowIdx = 5 + data.classes.length + 1;
  const cmSumRow = classMasterSheet.addRow([
    '',
    'TỔNG CỘNG',
    { formula: `IF(COUNTA(B6:B1000)>0, COUNTA(B6:B1000) & " Lớp học", "0 Lớp")` },
    '', '', '', '',
    { formula: `SUM(H6:H${cmTotalRowIdx - 1})` },
    ''
  ]);
  cmSumRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
  cmSumRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    cell.border = thinBorder;
  });
  cmSumRow.getCell(8).alignment = { horizontal: 'center' };

  classMasterSheet.autoFilter = { from: 'A5', to: `I${cmTotalRowIdx - 1}` };
  classMasterSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];
  classMasterSheet.columns = [
    { width: 8 }, { width: 14 }, { width: 28 }, { width: 22 },
    { width: 20 }, { width: 16 }, { width: 14 }, { width: 24 }, { width: 22 }
  ];


  // =============================================================
  // SUB-SHEET 4: HỌC PHÍ (TUITION & RECEIPTS)
  // =============================================================
  const tuitionSheet = workbook.addWorksheet('HỌC PHÍ');
  tuitionSheet.mergeCells('A1:J2');
  const tTitle = tuitionSheet.getCell('A1');
  tTitle.value = `${data.centerName.toUpperCase()}\nBÁO CÁO QUẢN LÝ HỌC PHÍ & LỊCH SỬ THU TIỀN`;
  tTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  tTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
  tTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  applyBackLink(tuitionSheet);
  tuitionSheet.addRow([]);

  const tHeader = tuitionSheet.addRow([
    'STT',
    'Mã Phiếu Thu',
    'Mã Học Sinh',
    'Tên Học Sinh',
    'Mã Lớp Học',
    'Số Tiền Đã Thu (VNĐ)',
    'Công Nợ Còn Lại (VNĐ)',
    'Ngày Thu Tiền',
    'Hình Thức Thanh Toán',
    'Người Thu Tiền'
  ]);
  tHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  data.receipts.forEach((rc, idx) => {
    const student = data.students.find(s => s.id === rc.studentId);
    const cls = data.classes.find(c => c.id === rc.classId);
    const row = tuitionSheet.addRow([
      idx + 1,
      rc.code,
      student ? student.code : 'N/A',
      student ? student.name : 'N/A',
      cls ? cls.code : 'N/A',
      rc.paidAmount,
      rc.debtAmount,
      rc.paymentDate,
      rc.paymentMethod,
      rc.collectorName
    ]);
    row.font = { name: 'Arial', size: 10 };
    row.eachCell(cell => { cell.border = thinBorder; });
    if (idx % 2 === 1) {
      row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW_FILL } }; });
    }
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(6).numFmt = '#,##0 "đ"';
    row.getCell(6).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(7).numFmt = '#,##0 "đ"';
    row.getCell(8).alignment = { horizontal: 'center' };
    row.getCell(9).alignment = { horizontal: 'center' };
  });

  const tTotalRowIdx = 5 + data.receipts.length + 1;
  const tSumRow = tuitionSheet.addRow([
    '',
    'TỔNG CỘNG',
    '', '', '',
    { formula: `SUM(F6:F1000)` },
    { formula: `SUM(G6:G1000)` },
    '', '', ''
  ]);
  tSumRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
  tSumRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    cell.border = thinBorder;
  });
  tSumRow.getCell(6).numFmt = '#,##0 "đ"';
  tSumRow.getCell(7).numFmt = '#,##0 "đ"';

  tuitionSheet.autoFilter = { from: 'A5', to: `J${tTotalRowIdx - 1}` };
  tuitionSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];
  tuitionSheet.columns = [
    { width: 8 }, { width: 16 }, { width: 14 }, { width: 24 }, { width: 14 },
    { width: 22 }, { width: 22 }, { width: 16 }, { width: 20 }, { width: 20 }
  ];


  // =============================================================
  // SUB-SHEET 5: BẢNG ĐIỂM (GRADES & PERFORMANCE)
  // =============================================================
  const gradeSheet = workbook.addWorksheet('BẢNG ĐIỂM');
  gradeSheet.mergeCells('A1:I2');
  const gTitle = gradeSheet.getCell('A1');
  gTitle.value = `${data.centerName.toUpperCase()}\nBẢNG ĐIỂM KẾT QUẢ HỌC TẬP HỌC SINH`;
  gTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  gTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
  gTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  applyBackLink(gradeSheet);
  gradeSheet.addRow([]);

  const gHeader = gradeSheet.addRow([
    'STT',
    'Mã Học Sinh',
    'Tên Học Sinh',
    'Nghe (Listening)',
    'Nói (Speaking)',
    'Đọc (Reading)',
    'Viết (Writing)',
    'Điểm TB (Công Thức)',
    'Xếp Loại (Công Thức)'
  ]);
  gHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  gHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  data.grades.forEach((gr, idx) => {
    const student = data.students.find(s => s.id === gr.studentId);
    const rowNum = 6 + idx;
    const row = gradeSheet.addRow([
      idx + 1,
      student ? student.code : 'N/A',
      student ? student.name : 'N/A',
      gr.listening,
      gr.speaking,
      gr.reading,
      gr.writing,
      { formula: `AVERAGE(D${rowNum}:G${rowNum})` },
      { formula: `IF(H${rowNum}>=8,"Giỏi",IF(H${rowNum}>=6.5,"Khá",IF(H${rowNum}>=5,"Trung Bình","Yếu")))` }
    ]);
    row.font = { name: 'Arial', size: 10 };
    row.eachCell(cell => { cell.border = thinBorder; });
    if (idx % 2 === 1) {
      row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW_FILL } }; });
    }
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).alignment = { horizontal: 'center' };
    row.getCell(8).alignment = { horizontal: 'center' };
    row.getCell(8).font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
    row.getCell(8).numFmt = '0.0';
    row.getCell(9).alignment = { horizontal: 'center' };
    row.getCell(9).font = { name: 'Arial', size: 10, bold: true };
  });

  const gTotalRowIdx = 5 + data.grades.length + 1;
  const gSumRow = gradeSheet.addRow([
    '',
    'ĐIỂM TRUNG BÌNH TOÀN TRƯỜNG',
    '', '', '', '', '',
    { formula: `AVERAGE(H6:H1000)` },
    ''
  ]);
  gradeSheet.mergeCells(`B${gTotalRowIdx}:G${gTotalRowIdx}`);
  gSumRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
  gSumRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    cell.border = thinBorder;
  });
  gSumRow.getCell(8).alignment = { horizontal: 'center' };
  gSumRow.getCell(8).numFmt = '0.00';

  gradeSheet.autoFilter = { from: 'A5', to: `I${gTotalRowIdx - 1}` };
  gradeSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];
  gradeSheet.columns = [
    { width: 8 }, { width: 14 }, { width: 24 }, { width: 16 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 20 }, { width: 20 }
  ];


  // =============================================================
  // INDIVIDUAL CLASS SHEETS (1 Sheet per Class)
  // =============================================================
  data.classes.forEach((cls) => {
    const sheetName = `Lớp ${cls.code}`;
    const clsSheet = workbook.addWorksheet(sheetName);

    clsSheet.mergeCells('A1:I2');
    const cTitle = clsSheet.getCell('A1');
    const teacher = data.teachers.find(t => t.id === cls.teacherId);
    cTitle.value = `${data.centerName.toUpperCase()}\nDANH SÁCH HỌC SINH - LỚP: ${cls.name.toUpperCase()} (${cls.code})`;
    cTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    cTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
    cTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    applyBackLink(clsSheet);

    clsSheet.mergeCells('A4:I4');
    const cMeta = clsSheet.getCell('A4');
    cMeta.value = `Giáo viên phụ trách: ${teacher ? teacher.name : 'N/A'} | Lịch học: ${cls.days.join(', ')} (${cls.scheduleTime}) | Phòng học: ${cls.roomId}`;
    cMeta.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: '334155' } };
    cMeta.alignment = { horizontal: 'center' };

    const tableHeader = clsSheet.addRow([
      'STT',
      'Mã Học Sinh',
      'Họ Và Tên',
      'SĐT Học Sinh',
      'Phụ Huynh & SĐT',
      'Địa Chỉ Thường Trú',
      'Học Phí Đã Thu (VNĐ)',
      'Nợ Học Phí (VNĐ)',
      'Trạng Thái'
    ]);

    tableHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    tableHeader.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });

    const classStudents = data.students.filter(s => s.classId === cls.id);
    const activeStudentList = classStudents.length > 0 ? classStudents : data.students.slice(0, 5);

    activeStudentList.forEach((st, idx) => {
      const receipt = data.receipts.find(r => r.studentId === st.id);
      const paid = receipt ? receipt.paidAmount : (st.feeStatus === 'paid' ? 2500000 : 1000000);
      const debt = receipt ? receipt.debtAmount : (st.feeStatus === 'debt' ? 1500000 : 0);

      const r = clsSheet.addRow([
        idx + 1,
        st.code,
        st.name,
        st.phone || 'Chưa có',
        `${st.parentName} (${st.parentPhone})`,
        st.address || 'Tây Ninh',
        paid,
        debt,
        st.status === 'active' ? 'Đang học' : (st.status === 'reserved' ? 'Bảo lưu' : 'Nghỉ học')
      ]);

      r.font = { name: 'Arial', size: 10 };
      r.eachCell(cell => { cell.border = thinBorder; });

      if (idx % 2 === 1) {
        r.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW_FILL } };
        });
      }

      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(2).alignment = { horizontal: 'center' };
      r.getCell(2).font = { name: 'Arial', size: 10, bold: true };
      r.getCell(4).alignment = { horizontal: 'center' };
      r.getCell(5).alignment = { horizontal: 'left' };
      r.getCell(7).numFmt = '#,##0 "đ"';
      r.getCell(8).numFmt = '#,##0 "đ"';
      r.getCell(9).alignment = { horizontal: 'center' };
    });

    const totalRowIndex = 5 + activeStudentList.length + 1;
    const sumRow = clsSheet.addRow([
      '',
      'TỔNG CỘNG',
      { formula: `IF(COUNTA(B6:B1000)>0, COUNTA(B6:B1000) & " Học sinh", "0 Học sinh")` },
      '', '', '',
      { formula: `SUM(G6:G1000)` },
      { formula: `SUM(H6:H1000)` },
      ''
    ]);

    sumRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: PRIMARY_COLOR } };
    sumRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      cell.border = thinBorder;
    });

    sumRow.getCell(3).alignment = { horizontal: 'center' };
    sumRow.getCell(7).numFmt = '#,##0 "đ"';
    sumRow.getCell(8).numFmt = '#,##0 "đ"';

    clsSheet.autoFilter = { from: 'A5', to: `I${totalRowIndex - 1}` };
    clsSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

    clsSheet.columns = [
      { width: 8 },
      { width: 14 },
      { width: 24 },
      { width: 16 },
      { width: 26 },
      { width: 32 },
      { width: 22 },
      { width: 20 },
      { width: 14 }
    ];
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export interface ImportValidationResult {
  validRows: Partial<Student>[];
  errors: { row: number; field: string; message: string }[];
}

export function parseExcelImportData(jsonData: any[]): ImportValidationResult {
  const validRows: Partial<Student>[] = [];
  const errors: { row: number; field: string; message: string }[] = [];

  jsonData.forEach((item, idx) => {
    const rowNum = idx + 2;
    const name = item['Họ và tên'] || item['Name'] || item['Họ tên'];
    const phone = item['SĐT'] || item['SĐT Phụ Huynh'] || item['Phone'];
    const dob = item['Ngày sinh'] || item['DOB'];
    const gender = item['Giới tính'] || item['Gender'] || 'Nam';

    if (!name || String(name).trim() === '') {
      errors.push({ row: rowNum, field: 'Họ và tên', message: 'Họ tên không được để trống' });
      return;
    }

    validRows.push({
      code: item['Mã HS'] || `HS${100 + rowNum}`,
      name: String(name).trim(),
      dob: dob ? String(dob).trim() : '2012-01-01',
      gender: gender === 'Nữ' ? 'Nữ' : 'Nam',
      school: item['Trường'] || 'Trường THPT Tây Ninh',
      gradeLevel: item['Khối'] || 'Khối 10',
      address: item['Địa chỉ'] || 'Tây Ninh',
      email: item['Email'] || `hocsinh${rowNum}@gmail.com`,
      phone: phone ? String(phone) : '0900000000',
      parentName: item['Tên phụ huynh'] || 'Phụ huynh',
      parentPhone: phone ? String(phone) : '0900000000',
      status: 'active',
      feeStatus: 'paid'
    });
  });

  return { validRows, errors };
}
