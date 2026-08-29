import ExcelJS from 'exceljs';
import { ClassRoom, CourseProgram, Grade, Room, Student, Teacher, TimetableSlot, TuitionReceipt } from '../types';

export interface ExcelExportData {
  centerName: string;
  programs: CourseProgram[];
  students: Student[];
  classes: ClassRoom[];
  teachers: Teacher[];
  rooms: Room[];
  receipts: TuitionReceipt[];
  grades: Grade[];
}

export interface ImportedStudentRow extends Partial<Student> {
  classCode?: string;
}

export interface ImportValidationResult {
  validRows: ImportedStudentRow[];
  errors: { row: number; field: string; message: string }[];
}

export interface CenterWorkbookData {
  programs: CourseProgram[];
  teachers: Teacher[];
  rooms: Room[];
  classes: ClassRoom[];
  students: Student[];
  timetableSlots: TimetableSlot[];
  grades: Grade[];
  receipts: TuitionReceipt[];
}

export interface CenterWorkbookImportResult {
  data?: CenterWorkbookData;
  errors: { row: number; field: string; message: string }[];
}

const COLOR = { primary: '8E0032', accent: 'C62828', light: 'FEF2F2', border: 'CBD5E1', link: '1D4ED8' };
const moneyFormat = '#,##0 "đ"';
const border: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLOR.border } }, left: { style: 'thin', color: { argb: COLOR.border } },
  bottom: { style: 'thin', color: { argb: COLOR.border } }, right: { style: 'thin', color: { argb: COLOR.border } }
};

const dateFromIso = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year || 2000, (month || 1) - 1, day || 1);
};
const monthKey = (value: string) => value.slice(0, 7);
const receiptPeriod = (receipt: TuitionReceipt) => receipt.billingPeriod || monthKey(receipt.paymentDate);
const columnLetter = (column: number) => {
  let remaining = column;
  let result = '';
  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return result;
};

const styleHeader = (row: ExcelJS.Row) => {
  row.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.accent } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border;
  });
  row.height = 30;
};
const styleData = (row: ExcelJS.Row, zebraIndex: number) => {
  row.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10 };
    cell.border = border;
    cell.alignment = { vertical: 'middle', wrapText: true };
    if (zebraIndex % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.light } };
  });
};
const styleTitle = (sheet: ExcelJS.Worksheet, range: string, value: string) => {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(':')[0]);
  cell.value = value;
  cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.primary } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.getRow(1).height = 42;
  sheet.getRow(2).height = 22;
};
const applyBackLink = (sheet: ExcelJS.Worksheet, endColumn: string) => {
  sheet.mergeCells(`A3:${endColumn}3`);
  const cell = sheet.getCell('A3');
  cell.value = { text: '← Quay về TỔNG QUAN', hyperlink: "#'TỔNG QUAN'!A1" };
  cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR.link }, underline: true };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
};
const writeFooter = (sheet: ExcelJS.Worksheet, rowNumber: number, columns: number, formulas: Record<number, string> = {}) => {
  const row = sheet.getRow(rowNumber);
  row.getCell(1).value = 'TỔNG CỘNG';
  Object.entries(formulas).forEach(([column, formula]) => { row.getCell(Number(column)).value = { formula }; });
  for (let column = 1; column <= columns; column += 1) {
    const cell = row.getCell(column);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR.primary } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    cell.border = border;
  }
};
const studentStatusLabel = (status: Student['status']) => status === 'reserved' ? 'Bảo lưu' : (status === 'dropped' ? 'Nghỉ học' : 'Đang học');
const classSheetName = (classroom: ClassRoom) => `Lớp ${classroom.code}`.slice(0, 31);
const withWorksheetLink = (target: string | undefined, formula: string) => target ? `HYPERLINK("${target}",${formula})` : formula;
const styleFormulaLink = (cell: ExcelJS.Cell) => {
  cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR.link }, underline: true };
};

export async function generateMasterExcelWorkbook(data: ExcelExportData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.centerName;
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const months = [...new Set(data.receipts.map(receiptPeriod).filter(Boolean))].sort();
  const classSheetNames = new Map(data.classes.map((classroom) => [classroom.id, classSheetName(classroom)]));
  const classById = new Map(data.classes.map((classroom) => [classroom.id, classroom]));
  const programById = new Map(data.programs.map((program) => [program.id, program]));
  const studentById = new Map(data.students.map((student) => [student.id, student]));
  const teacherById = new Map(data.teachers.map((teacher) => [teacher.id, teacher]));
  const roomById = new Map(data.rooms.map((room) => [room.id, room]));
  const orderedReceipts = [...data.receipts].sort((left, right) => {
    const leftClass = classById.get(left.classId)?.code || '';
    const rightClass = classById.get(right.classId)?.code || '';
    const leftStudent = studentById.get(left.studentId)?.code || '';
    const rightStudent = studentById.get(right.studentId)?.code || '';
    return leftClass.localeCompare(rightClass, 'vi') || leftStudent.localeCompare(rightStudent, 'vi') || left.paymentDate.localeCompare(right.paymentDate) || left.code.localeCompare(right.code);
  });
  const firstReceiptRowByStudentId = new Map<string, number>();
  const firstReceiptRowByClassMonth = new Map<string, number>();
  orderedReceipts.forEach((receipt, index) => {
    const rowNumber = 6 + index;
    if (!firstReceiptRowByStudentId.has(receipt.studentId)) firstReceiptRowByStudentId.set(receipt.studentId, rowNumber);
    const classMonthKey = `${receipt.classId}:${receiptPeriod(receipt)}`;
    if (!firstReceiptRowByClassMonth.has(classMonthKey)) firstReceiptRowByClassMonth.set(classMonthKey, rowNumber);
  });
  const firstReceiptLink = orderedReceipts.length ? "#'HỌC PHÍ'!A6" : "#'HỌC PHÍ'!A1";

  const summary = workbook.addWorksheet('TỔNG QUAN');
  styleTitle(summary, 'A1:Z2', `${data.centerName.toUpperCase()}\nBÁO CÁO TỔNG QUAN VÀ THU HỌC PHÍ THEO THÁNG`);
  summary.mergeCells('A3:Z3');
  summary.getCell('A3').value = `Xuất lúc ${new Date().toLocaleString('vi-VN')} · Các công thức liên kết trực tiếp tới sheet HỌC PHÍ.`;
  summary.getCell('A3').note = 'Nguồn dữ liệu: PhucPhucThinh_BaoCaoToanHeThong_2026-08-10 (1).xlsx do người dùng cung cấp.';
  summary.getCell('A3').font = { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } };
  summary.getCell('A3').alignment = { horizontal: 'center' };
  summary.mergeCells('A5:Z5');
  summary.getCell('A5').value = 'I. CHỈ SỐ TỔNG HỢP';
  summary.getCell('A5').font = { name: 'Arial', size: 11, bold: true, color: { argb: COLOR.primary } };
  summary.getRow(6).values = ['Chỉ số', 'Giá trị', 'Đơn vị', 'Nguồn công thức'];
  styleHeader(summary.getRow(6));
  const kpis = [
    ['Tổng học sinh', { formula: "COUNTA('HỌC SINH'!$B$6:$B$1048576)" }, 'Học sinh', 'Sheet HỌC SINH'],
    ['Tổng học phí đã thu', { formula: withWorksheetLink(firstReceiptLink, "SUMIFS('HỌC PHÍ'!$L:$L,'HỌC PHÍ'!$A:$A,\"<>TỔNG CỘNG\")") }, 'VNĐ', 'Bấm để mở SỔ THU HỌC PHÍ'],
    ['Tổng công nợ', { formula: withWorksheetLink(firstReceiptLink, "SUMIFS('HỌC PHÍ'!$M:$M,'HỌC PHÍ'!$A:$A,\"<>TỔNG CỘNG\")") }, 'VNĐ', 'Bấm để mở SỔ THU HỌC PHÍ'],
    ['Tỷ lệ thu', { formula: 'IFERROR(B8/(B8+B9),0)' }, '%', 'Đã thu / (đã thu + công nợ)']
  ];
  const kpiSourceLinks = ["#'HỌC SINH'!A1", firstReceiptLink, firstReceiptLink, undefined];
  kpis.forEach((values, index) => {
    const row = summary.getRow(7 + index);
    row.values = values;
    styleData(row, index);
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR.primary } };
    const sourceLink = kpiSourceLinks[index];
    if (sourceLink) {
      row.getCell(4).value = { text: String(values[3]), hyperlink: sourceLink };
      row.getCell(4).font = { name: 'Arial', size: 10, color: { argb: COLOR.link }, underline: true };
    }
    if (index === 1 || index === 2) styleFormulaLink(row.getCell(2));
  });
  summary.getCell('B8').numFmt = moneyFormat;
  summary.getCell('B9').numFmt = moneyFormat;
  summary.getCell('B10').numFmt = '0.0%';

  const monthlyTitleRow = 13;
  summary.mergeCells(`A${monthlyTitleRow}:Z${monthlyTitleRow}`);
  summary.getCell(`A${monthlyTitleRow}`).value = 'II. TỔNG THU HỌC PHÍ THEO THÁNG VÀ TỪNG LỚP';
  summary.getCell(`A${monthlyTitleRow}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: COLOR.primary } };
  const monthlyHeaderRow = monthlyTitleRow + 1;
  const monthlyHeaders = ['Mã lớp', 'Tên lớp', 'Sĩ số', ...months.map((month) => `Tháng ${month.slice(5)}/${month.slice(0, 4)}`), 'Tổng đã thu', 'Công nợ'];
  summary.getRow(monthlyHeaderRow).values = monthlyHeaders;
  styleHeader(summary.getRow(monthlyHeaderRow));
  months.forEach((month, index) => {
    const cell = summary.getCell(monthlyHeaderRow, 4 + index);
    cell.value = dateFromIso(`${month}-01`);
    cell.numFmt = '"Tháng "mm/yyyy';
  });

  const classStartRow = monthlyHeaderRow + 1;
  data.classes.forEach((classroom, index) => {
    const rowNumber = classStartRow + index;
    const row = summary.getRow(rowNumber);
    row.getCell(1).value = classroom.code;
    row.getCell(2).value = classroom.name;
    row.getCell(3).value = { formula: `COUNTIF('HỌC SINH'!$G:$G,$A${rowNumber})` };
    months.forEach((_, monthIndex) => {
      const column = 4 + monthIndex;
      const header = `${columnLetter(column)}$${monthlyHeaderRow}`;
      const monthTarget = `#'${classSheetNames.get(classroom.id)}'!${columnLetter(2 + monthIndex)}6`;
      row.getCell(column).value = { formula: withWorksheetLink(monthTarget, `SUMIFS('HỌC PHÍ'!$L:$L,'HỌC PHÍ'!$F:$F,$A${rowNumber},'HỌC PHÍ'!$J:$J,">="&${header},'HỌC PHÍ'!$J:$J,"<"&EDATE(${header},1))`) };
      row.getCell(column).numFmt = moneyFormat;
    });
    const totalColumn = 4 + months.length;
    const debtColumn = totalColumn + 1;
    const classTarget = `#'${classSheetNames.get(classroom.id)}'!A6`;
    row.getCell(totalColumn).value = { formula: withWorksheetLink(classTarget, `SUMIFS('HỌC PHÍ'!$L:$L,'HỌC PHÍ'!$F:$F,$A${rowNumber})`) };
    row.getCell(debtColumn).value = { formula: withWorksheetLink(classTarget, `SUMIFS('HỌC PHÍ'!$M:$M,'HỌC PHÍ'!$F:$F,$A${rowNumber})`) };
    row.getCell(totalColumn).numFmt = moneyFormat;
    row.getCell(debtColumn).numFmt = moneyFormat;
    styleData(row, index);
    for (let column = 4; column <= debtColumn; column += 1) styleFormulaLink(row.getCell(column));
  });
  const classTotalRow = classStartRow + data.classes.length;
  const lastDataColumn = 5 + months.length;
  const footerFormulas: Record<number, string> = { 3: `SUM(C${classStartRow}:C${classTotalRow - 1})` };
  for (let column = 4; column <= lastDataColumn; column += 1) footerFormulas[column] = `SUM(${columnLetter(column)}${classStartRow}:${columnLetter(column)}${classTotalRow - 1})`;
  writeFooter(summary, classTotalRow, lastDataColumn, footerFormulas);
  for (let column = 4; column <= lastDataColumn; column += 1) summary.getCell(classTotalRow, column).numFmt = moneyFormat;
  summary.autoFilter = { from: `A${monthlyHeaderRow}`, to: `${columnLetter(lastDataColumn)}${classTotalRow - 1}` };
  summary.views = [{ state: 'frozen', ySplit: monthlyHeaderRow }];
  summary.columns = [{ width: 18 }, { width: 32 }, { width: 12 }, ...months.map(() => ({ width: 18 })), { width: 18 }, { width: 18 }];

  const studentsSheet = workbook.addWorksheet('HỌC SINH');
  styleTitle(studentsSheet, 'A1:O2', `${data.centerName.toUpperCase()}\nDANH SÁCH HỌC SINH`);
  applyBackLink(studentsSheet, 'O');
  const studentHeaders = ['STT', 'Mã học sinh', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Chương trình', 'Mã lớp', 'SĐT học sinh', 'SĐT phụ huynh', 'Địa chỉ', 'Trạng thái', 'Ghi chú', 'Tổng học phí (VNĐ)', 'Tổng nợ học phí (VNĐ)', 'ID hệ thống'];
  studentsSheet.getRow(5).values = studentHeaders;
  styleHeader(studentsSheet.getRow(5));
  const studentSheetRowById = new Map<string, number>();
  data.students.forEach((student, index) => {
    const rowNumber = 6 + index;
    const classroom = classById.get(student.classId);
    const receiptLink = firstReceiptRowByStudentId.has(student.id) ? `#'HỌC PHÍ'!A${firstReceiptRowByStudentId.get(student.id)}` : undefined;
    const row = studentsSheet.getRow(rowNumber);
    const classLink = classroom ? `#'${classSheetNames.get(classroom.id)}'!A1` : undefined;
    row.values = [index + 1, student.code, student.name, student.gender, student.dob, programById.get(student.programId)?.name || student.programId, classLink ? { text: classroom?.code || '', hyperlink: classLink } : (classroom?.code || ''), student.phone, student.parentPhone, student.address, studentStatusLabel(student.status), student.notes || '', { formula: withWorksheetLink(receiptLink, `SUMIFS('HỌC PHÍ'!$L:$L,'HỌC PHÍ'!$C:$C,$O${rowNumber})`) }, { formula: withWorksheetLink(receiptLink, `SUMIFS('HỌC PHÍ'!$M:$M,'HỌC PHÍ'!$C:$C,$O${rowNumber})`) }, student.id];
    styleData(row, index);
    row.getCell(13).numFmt = moneyFormat;
    row.getCell(14).numFmt = moneyFormat;
    if (firstReceiptRowByStudentId.has(student.id)) {
      styleFormulaLink(row.getCell(13));
      styleFormulaLink(row.getCell(14));
    }
    if (classLink) row.getCell(7).font = { name: 'Arial', size: 10, color: { argb: COLOR.link }, underline: true, bold: true };
    studentSheetRowById.set(student.id, rowNumber);
  });
  const studentFooterRow = 6 + data.students.length;
  writeFooter(studentsSheet, studentFooterRow, studentHeaders.length, { 3: `COUNTA(B6:B${studentFooterRow - 1})` });
  studentsSheet.autoFilter = { from: 'A5', to: `O${studentFooterRow - 1}` };
  studentsSheet.views = [{ state: 'frozen', ySplit: 5 }];
  studentsSheet.columns = [{ width: 8 }, { width: 16 }, { width: 28 }, { width: 18 }, { width: 14 }, { width: 20 }, { width: 18 }, { width: 17 }, { width: 18 }, { width: 35 }, { width: 15 }, { width: 55 }, { width: 20 }, { width: 22 }, { width: 18 }];
  studentsSheet.getColumn(15).hidden = true;

  const classSheet = workbook.addWorksheet('LỚP HỌC');
  styleTitle(classSheet, 'A1:J2', `${data.centerName.toUpperCase()}\nDANH SÁCH LỚP HỌC`);
  applyBackLink(classSheet, 'J');
  const classHeaders = ['STT', 'Mã lớp', 'Tên lớp', 'Chương trình', 'Giáo viên', 'Lịch học', 'Phòng', 'Sức chứa', 'Sĩ số', 'Sheet chi tiết'];
  classSheet.getRow(5).values = classHeaders;
  styleHeader(classSheet.getRow(5));
  data.classes.forEach((classroom, index) => {
    const rowNumber = 6 + index;
    const row = classSheet.getRow(rowNumber);
    const teacher = teacherById.get(classroom.teacherId);
    row.values = [index + 1, classroom.code, classroom.name, programById.get(classroom.programId)?.name || classroom.programId, teacher?.name || 'Chưa cập nhật', classroom.scheduleTime || classroom.days.join(', '), roomById.get(classroom.roomId)?.name || classroom.roomId || 'Chưa cập nhật', classroom.capacity || 'Chưa cập nhật', { formula: `COUNTIF('HỌC SINH'!$G:$G,B${rowNumber})` }, { text: `→ ${classSheetNames.get(classroom.id)}`, hyperlink: `#'${classSheetNames.get(classroom.id)}'!A1` }];
    styleData(row, index);
    row.getCell(10).font = { name: 'Arial', size: 10, color: { argb: COLOR.link }, underline: true, bold: true };
  });
  const classFooterRow = 6 + data.classes.length;
  writeFooter(classSheet, classFooterRow, classHeaders.length, { 3: `COUNTA(B6:B${classFooterRow - 1})`, 9: `SUM(I6:I${classFooterRow - 1})` });
  classSheet.autoFilter = { from: 'A5', to: `J${classFooterRow - 1}` };
  classSheet.views = [{ state: 'frozen', ySplit: 5 }];
  classSheet.columns = [{ width: 8 }, { width: 18 }, { width: 32 }, { width: 26 }, { width: 26 }, { width: 32 }, { width: 16 }, { width: 14 }, { width: 12 }, { width: 28 }];

  const tuitionSheet = workbook.addWorksheet('HỌC PHÍ');
  styleTitle(tuitionSheet, 'A1:S2', `${data.centerName.toUpperCase()}\nSỔ THU HỌC PHÍ`);
  applyBackLink(tuitionSheet, 'S');
  const tuitionHeaders = ['STT', 'Mã phiếu', 'ID hệ thống', 'Mã học sinh', 'Họ và tên', 'Mã lớp', 'Học phí khóa (VNĐ)', 'Học phí tháng (VNĐ)', 'Khoản thu', 'Kỳ học phí', 'Giảm giá (VNĐ)', 'Đã thu (VNĐ)', 'Công nợ (VNĐ)', 'Tình trạng', 'Ngày thu', 'Hình thức', 'Ghi chú', 'Hồ sơ học sinh', 'Lớp chi tiết'];
  tuitionSheet.getRow(5).values = tuitionHeaders;
  styleHeader(tuitionSheet.getRow(5));
  orderedReceipts.forEach((receipt, index) => {
    const student = studentById.get(receipt.studentId);
    const classroom = classById.get(receipt.classId);
    const row = tuitionSheet.getRow(6 + index);
    const studentRow = studentSheetRowById.get(receipt.studentId);
    const studentLink = studentRow ? { text: '→ Học sinh', hyperlink: `#'HỌC SINH'!A${studentRow}` } : '—';
    const classLink = classroom ? { text: `→ ${classroom.code}`, hyperlink: `#'${classSheetNames.get(classroom.id)}'!A1` } : '—';
    const period = receiptPeriod(receipt);
    const status = receipt.status || (receipt.debtAmount <= 0 && receipt.paidAmount > 0 ? 'paid' : (receipt.paidAmount > 0 ? 'partial' : 'unpaid'));
    row.values = [index + 1, receipt.code, receipt.studentId, student?.code || '', student?.name || '', classroom?.code || '', receipt.courseFee, receipt.monthlyFee || 0, receipt.paymentKind === 'monthly' ? 'Học phí tháng' : 'Học phí khóa', dateFromIso(`${period || monthKey(receipt.paymentDate)}-01`), receipt.discount, receipt.paidAmount, receipt.debtAmount, status === 'paid' ? 'Đã đóng đủ' : ((status === 'partial' || status === 'debt') ? 'Đóng thiếu' : 'Chưa đóng'), dateFromIso(receipt.paymentDate), receipt.paymentMethod, receipt.notes || '', studentLink, classLink];
    styleData(row, index);
    [7, 8, 11, 12, 13].forEach((column) => { row.getCell(column).numFmt = moneyFormat; });
    row.getCell(10).numFmt = 'mm/yyyy';
    row.getCell(15).numFmt = 'dd/mm/yyyy';
    [18, 19].forEach((column) => { row.getCell(column).font = { name: 'Arial', size: 10, color: { argb: COLOR.link }, underline: true, bold: true }; });
  });
  const tuitionFooterRow = 6 + orderedReceipts.length;
  writeFooter(tuitionSheet, tuitionFooterRow, tuitionHeaders.length, { 12: `SUM(L6:L${tuitionFooterRow - 1})`, 13: `SUM(M6:M${tuitionFooterRow - 1})` });
  tuitionSheet.getCell(tuitionFooterRow, 12).numFmt = moneyFormat;
  tuitionSheet.getCell(tuitionFooterRow, 13).numFmt = moneyFormat;
  tuitionSheet.autoFilter = { from: 'A5', to: `S${tuitionFooterRow - 1}` };
  tuitionSheet.views = [{ state: 'frozen', ySplit: 5 }];
  tuitionSheet.columns = [{ width: 8 }, { width: 18 }, { width: 16 }, { width: 16 }, { width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 20 }, { width: 48 }, { width: 18 }, { width: 18 }];
  tuitionSheet.getColumn(3).hidden = true;

  const gradesSheet = workbook.addWorksheet('BẢNG ĐIỂM');
  styleTitle(gradesSheet, 'A1:J2', `${data.centerName.toUpperCase()}\nBẢNG ĐIỂM`);
  applyBackLink(gradesSheet, 'J');
  const gradeHeaders = ['STT', 'Mã học sinh', 'Họ và tên', 'Mã lớp', 'Nghe', 'Nói', 'Đọc', 'Viết', 'Điểm TB', 'Xếp loại'];
  gradesSheet.getRow(5).values = gradeHeaders;
  styleHeader(gradesSheet.getRow(5));
  data.grades.forEach((grade, index) => {
    const rowNumber = 6 + index;
    const student = data.students.find((item) => item.id === grade.studentId);
    const classroom = classById.get(grade.classId);
    const row = gradesSheet.getRow(rowNumber);
    row.values = [index + 1, student?.code || '', student?.name || '', classroom?.code || '', grade.listening, grade.speaking, grade.reading, grade.writing, { formula: `AVERAGE(E${rowNumber}:H${rowNumber})` }, { formula: `IF(I${rowNumber}>=8,"Giỏi",IF(I${rowNumber}>=6.5,"Khá",IF(I${rowNumber}>=5,"Trung bình","Cần hỗ trợ")))` }];
    styleData(row, index);
  });
  const gradesFooterRow = 6 + data.grades.length;
  writeFooter(gradesSheet, gradesFooterRow, gradeHeaders.length, { 9: data.grades.length ? `AVERAGE(I6:I${gradesFooterRow - 1})` : '0' });
  gradesSheet.autoFilter = { from: 'A5', to: `J${Math.max(5, gradesFooterRow - 1)}` };
  gradesSheet.views = [{ state: 'frozen', ySplit: 5 }];
  gradesSheet.columns = [{ width: 8 }, { width: 16 }, { width: 28 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 18 }];

  data.classes.forEach((classroom) => {
    const sheet = workbook.addWorksheet(classSheetNames.get(classroom.id)!);
    const classEndColumn = columnLetter(Math.max(11, months.length + 1));
    styleTitle(sheet, `A1:${classEndColumn}2`, `${data.centerName.toUpperCase()}\nDANH SÁCH HỌC SINH - ${classroom.name.toUpperCase()}`);
    applyBackLink(sheet, classEndColumn);
    const teacher = teacherById.get(classroom.teacherId);
    sheet.mergeCells(`A4:${classEndColumn}4`);
    sheet.getCell('A4').value = `Giáo viên: ${teacher?.name || 'Chưa cập nhật'} · Lịch: ${classroom.scheduleTime || classroom.days.join(', ')} · Phòng: ${roomById.get(classroom.roomId)?.name || classroom.roomId || 'Chưa cập nhật'}`;
    sheet.getCell('A4').font = { name: 'Arial', size: 9.5, italic: true, color: { argb: '475569' } };
    sheet.getCell('A4').alignment = { horizontal: 'center' };
    sheet.getRow(6).values = ['Kỳ thu', ...months.map((month) => dateFromIso(`${month}-01`))];
    styleHeader(sheet.getRow(6));
    months.forEach((_, index) => sheet.getCell(6, 2 + index).numFmt = '"Tháng "mm/yyyy');
    const monthlyPaidRow = sheet.getRow(7);
    const monthlyDebtRow = sheet.getRow(8);
    monthlyPaidRow.getCell(1).value = 'Đã thu (VNĐ)';
    monthlyDebtRow.getCell(1).value = 'Công nợ (VNĐ)';
    months.forEach((month, index) => {
      const column = 2 + index;
      const header = `${columnLetter(column)}$6`;
      const receiptRow = firstReceiptRowByClassMonth.get(`${classroom.id}:${month}`);
      const receiptLink = receiptRow ? `#'HỌC PHÍ'!A${receiptRow}` : undefined;
      monthlyPaidRow.getCell(column).value = { formula: withWorksheetLink(receiptLink, `SUMIFS('HỌC PHÍ'!$L:$L,'HỌC PHÍ'!$F:$F,"${classroom.code}",'HỌC PHÍ'!$J:$J,">="&${header},'HỌC PHÍ'!$J:$J,"<"&EDATE(${header},1))`) };
      monthlyDebtRow.getCell(column).value = { formula: withWorksheetLink(receiptLink, `SUMIFS('HỌC PHÍ'!$M:$M,'HỌC PHÍ'!$F:$F,"${classroom.code}",'HỌC PHÍ'!$J:$J,">="&${header},'HỌC PHÍ'!$J:$J,"<"&EDATE(${header},1))`) };
      monthlyPaidRow.getCell(column).numFmt = moneyFormat;
      monthlyDebtRow.getCell(column).numFmt = moneyFormat;
    });
    [monthlyPaidRow, monthlyDebtRow].forEach((row, index) => {
      styleData(row, index);
      row.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR.primary } };
    });
    months.forEach((month, index) => {
      if (firstReceiptRowByClassMonth.has(`${classroom.id}:${month}`)) {
        styleFormulaLink(monthlyPaidRow.getCell(2 + index));
        styleFormulaLink(monthlyDebtRow.getCell(2 + index));
      }
    });
    sheet.mergeCells(`A10:${classEndColumn}10`);
    sheet.getCell('A10').value = 'CHI TIẾT HỌC SINH VÀ PHIẾU THU';
    sheet.getCell('A10').font = { name: 'Arial', size: 11, bold: true, color: { argb: COLOR.primary } };
    const headers = ['STT', 'Mã học sinh', 'Họ và tên', 'SĐT học sinh', 'SĐT phụ huynh', 'Địa chỉ', 'Tổng học phí (VNĐ)', 'Tổng nợ học phí (VNĐ)', 'Xem phiếu', 'Trạng thái', 'ID hệ thống'];
    sheet.getRow(11).values = headers;
    styleHeader(sheet.getRow(11));
    const classStudents = data.students.filter((student) => student.classId === classroom.id);
    classStudents.forEach((student, index) => {
      const rowNumber = 12 + index;
      const receiptRow = firstReceiptRowByStudentId.get(student.id);
      const receiptLink = receiptRow ? `#'HỌC PHÍ'!A${receiptRow}` : undefined;
      const row = sheet.getRow(rowNumber);
      row.values = [index + 1, student.code, student.name, student.phone, student.parentPhone, student.address, { formula: withWorksheetLink(receiptLink, `SUMIFS('HỌC PHÍ'!$L:$L,'HỌC PHÍ'!$C:$C,$K${rowNumber})`) }, { formula: withWorksheetLink(receiptLink, `SUMIFS('HỌC PHÍ'!$M:$M,'HỌC PHÍ'!$C:$C,$K${rowNumber})`) }, receiptLink ? { text: '→ Phiếu thu', hyperlink: receiptLink } : 'Chưa có phiếu', studentStatusLabel(student.status), student.id];
      styleData(row, index);
      row.getCell(7).numFmt = moneyFormat;
      row.getCell(8).numFmt = moneyFormat;
      if (receiptLink) {
        styleFormulaLink(row.getCell(7));
        styleFormulaLink(row.getCell(8));
        row.getCell(9).font = { name: 'Arial', size: 10, color: { argb: COLOR.link }, underline: true, bold: true };
      }
    });
    const footerRow = 12 + classStudents.length;
    writeFooter(sheet, footerRow, headers.length, { 3: `COUNTA(B12:B${footerRow - 1})`, 7: `SUM(G12:G${footerRow - 1})`, 8: `SUM(H12:H${footerRow - 1})` });
    sheet.getCell(footerRow, 7).numFmt = moneyFormat;
    sheet.getCell(footerRow, 8).numFmt = moneyFormat;
    sheet.autoFilter = { from: 'A11', to: `K${footerRow - 1}` };
    sheet.views = [{ state: 'frozen', ySplit: 11 }];
    sheet.columns = [{ width: 14 }, ...months.map(() => ({ width: 18 })), ...Array.from({ length: Math.max(0, 11 - (months.length + 1)) }, () => ({ width: 18 }))];
    const detailColumns = [{ width: 8 }, { width: 16 }, { width: 28 }, { width: 17 }, { width: 18 }, { width: 36 }, { width: 20 }, { width: 22 }, { width: 16 }, { width: 15 }, { width: 18 }];
    detailColumns.forEach((column, index) => { sheet.getColumn(index + 1).width = column.width; });
    sheet.getColumn(11).hidden = true;
  });

  const guide = workbook.addWorksheet('HƯỚNG DẪN');
  styleTitle(guide, 'A1:H2', `${data.centerName.toUpperCase()}\nHƯỚNG DẪN NHẬP VÀ CÔNG THỨC EXCEL`);
  const guideRows = [
    ['1. Nhập học sinh', 'Thêm học sinh ở sheet HỌC SINH. Cột “Mã lớp” phải trùng chính xác với mã ở sheet LỚP HỌC.'],
    ['2. Nhập học phí', 'Thêm một dòng ngay phía trên “TỔNG CỘNG” ở sheet HỌC PHÍ. Nhập Mã phiếu, ID học sinh, Mã lớp, học phí khóa/tháng, khoản thu, kỳ học phí, đã thu và công nợ; không đổi tên các cột.'],
    ['3. Công thức tổng thu tháng/lớp', "=SUMIFS('HỌC PHÍ'!$L:$L,'HỌC PHÍ'!$F:$F,$A15,'HỌC PHÍ'!$J:$J,\">=\"&D$14,'HỌC PHÍ'!$J:$J,\"<\"&EDATE(D$14,1))"],
    ['4. Liên kết khi bấm', 'Các ô màu xanh gạch chân và cột “Nguồn công thức” là liên kết: bấm để mở sheet nguồn, tháng/lớp hoặc phiếu thu. Nếu Excel đang bật bảo vệ liên kết, hãy giữ Ctrl rồi bấm.'],
    ['5. Cách hoạt động', 'Khi thêm hoặc xóa học viên/phiếu thu trực tiếp trong Excel, hãy chèn hoặc xóa dòng trong vùng dữ liệu ngay phía trên “TỔNG CỘNG”. Các công thức SUMIFS/COUNTIF dùng toàn cột nên TỔNG QUAN, HỌC SINH và thống kê lớp tự cập nhật; không cần quay về trang chủ.'],
    ['6. Lưu ý dữ liệu nguồn', 'Nguồn: PhucPhucThinh_BaoCaoToanHeThong_2026-08-10 (1).xlsx. Các trường thiếu được để trống. Cột T7 lặp lại ở Jolly sp4 được ghi chú và chuẩn hoá thành kỳ T8/2026. Tiền sách được lưu trong ghi chú, không cộng vào học phí.']
  ];
  guideRows.forEach((values, index) => {
    const row = guide.getRow(4 + index);
    row.values = values;
    styleData(row, index);
    row.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR.primary } };
  });
  guide.columns = [{ width: 28 }, { width: 120 }];
  guide.getColumn(2).alignment = { wrapText: true, vertical: 'top' };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const normaliseHeader = (value: unknown) => String(value ?? '').replace(/[Đđ]/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi-VN').replace(/[^a-z0-9]/g, '');
const getByAliases = (record: Record<string, unknown>, aliases: string[]) => Object.entries(record).map(([key, value]) => [normaliseHeader(key), value] as const).find(([key]) => aliases.includes(key))?.[1];
const cellText = (value: unknown) => {
  if (value && typeof value === 'object' && 'formula' in value) return '';
  return String(value ?? '').trim();
};

export function parseExcelImportData(jsonData: Record<string, unknown>[]): ImportValidationResult {
  const validRows: ImportedStudentRow[] = [];
  const errors: ImportValidationResult['errors'] = [];
  jsonData.forEach((item, index) => {
    const row = index + 2;
    const name = cellText(getByAliases(item, ['hovaten', 'hoten', 'name']));
    const code = cellText(getByAliases(item, ['mahocsinh', 'mahs', 'studentcode']));
    if (!name) { errors.push({ row, field: 'Họ và tên', message: 'Họ và tên không được để trống.' }); return; }
    if (!code) { errors.push({ row, field: 'Mã học sinh', message: 'Mã học sinh không được để trống.' }); return; }
    const gender = String(getByAliases(item, ['gioitinh', 'gender']) ?? 'Chưa xác định');
    validRows.push({
      code, name, dob: String(getByAliases(item, ['ngaysinh', 'dob']) ?? ''), gender: gender === 'Nam' || gender === 'Nữ' ? gender : 'Chưa xác định',
      school: String(getByAliases(item, ['truong', 'school']) ?? ''), gradeLevel: String(getByAliases(item, ['khoi', 'gradelevel']) ?? ''), classCode: String(getByAliases(item, ['malop', 'classcode']) ?? ''),
      address: String(getByAliases(item, ['diachi', 'address']) ?? ''), email: String(getByAliases(item, ['email']) ?? ''), phone: String(getByAliases(item, ['sdthocsinh', 'sdt', 'phone']) ?? ''),
      parentName: String(getByAliases(item, ['tenphuhuynh', 'parentname']) ?? ''), parentPhone: String(getByAliases(item, ['sdtphuhuynh', 'parentphone']) ?? '')
    });
  });
  return { validRows, errors };
}

export async function parseExcelStudentFile(file: File): Promise<ImportValidationResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const rows: Record<string, unknown>[] = [];
  const masterStudentsSheet = workbook.getWorksheet('HỌC SINH');
  const sheets = masterStudentsSheet ? [masterStudentsSheet] : workbook.worksheets;
  sheets.forEach((sheet) => {
    let headerRow = 0;
    let headers: string[] = [];
    for (let rowNumber = 1; rowNumber <= Math.min(20, sheet.rowCount); rowNumber += 1) {
      const rowValues = sheet.getRow(rowNumber).values;
      const candidate = (Array.isArray(rowValues) ? rowValues.slice(1) : []).map(cellText);
      const normalised = candidate.map(normaliseHeader);
      if (normalised.includes('mahocsinh') && (normalised.includes('hovaten') || normalised.includes('hoten'))) { headerRow = rowNumber; headers = candidate; break; }
    }
    if (!headerRow) return;
    for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const rowValues = sheet.getRow(rowNumber).values;
      const values = Array.isArray(rowValues) ? rowValues.slice(1) : [];
      const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
      const code = cellText(getByAliases(record, ['mahocsinh', 'mahs', 'studentcode']));
      const name = cellText(getByAliases(record, ['hovaten', 'hoten', 'name']));
      if (!code && !name) continue;
      rows.push(record);
    }
  });
  return rows.length ? parseExcelImportData(rows) : { validRows: [], errors: [{ row: 0, field: 'Tệp Excel', message: 'Không tìm thấy sheet có cột “Mã học sinh” và “Họ và tên”.' }] };
}

const readRecords = (sheet: ExcelJS.Worksheet, requiredHeaders: string[]) => {
  let headers: string[] = [];
  let headerRow = 0;
  for (let rowNumber = 1; rowNumber <= Math.min(20, sheet.rowCount); rowNumber += 1) {
    const values = sheet.getRow(rowNumber).values;
    const candidate = (Array.isArray(values) ? values.slice(1) : []).map(cellText);
    const normalized = candidate.map(normaliseHeader);
    if (requiredHeaders.every((header) => normalized.includes(header))) {
      headers = candidate;
      headerRow = rowNumber;
      break;
    }
  }
  if (!headerRow) return [] as Record<string, unknown>[];
  const records: Record<string, unknown>[] = [];
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const values = sheet.getRow(rowNumber).values;
    const cells = Array.isArray(values) ? values.slice(1) : [];
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    const firstValue = cellText(cells[0]);
    if (!Object.values(record).some((value) => cellText(value))) continue;
    if (firstValue.toLocaleUpperCase('vi-VN').includes('TỔNG')) continue;
    records.push(record);
  }
  return records;
};

const numberValue = (value: unknown) => {
  if (typeof value === 'number') return value;
  const parsed = Number(cellText(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isoDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const text = cellText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : new Date().toISOString().slice(0, 10);
};

const statusFromLabel = (value: unknown): Student['status'] => {
  const label = cellText(value).toLocaleLowerCase('vi-VN');
  if (label.includes('bảo')) return 'reserved';
  if (label.includes('nghỉ')) return 'dropped';
  return 'active';
};

export async function parseCenterWorkbookFile(file: File): Promise<CenterWorkbookImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const classMaster = workbook.getWorksheet('LỚP HỌC');
  const tuitionSheet = workbook.getWorksheet('HỌC PHÍ');
  if (!classMaster || !tuitionSheet) {
    return { errors: [{ row: 0, field: 'Tệp Excel', message: 'Đây không phải báo cáo đã chuẩn hoá. Hãy dùng file “...DaChuanHoa.xlsx” được tạo từ hệ thống.' }] };
  }

  const classRecords = readRecords(classMaster, ['malop', 'tenlop']);
  if (!classRecords.length) {
    return { errors: [{ row: 0, field: 'LỚP HỌC', message: 'Không tìm thấy lớp hợp lệ trong báo cáo.' }] };
  }

  const teacherNames = new Set<string>();
  const roomNames = new Set<string>();
  const importedClasses = classRecords.map((record, index) => {
    const code = cellText(getByAliases(record, ['malop', 'classcode']));
    const name = cellText(getByAliases(record, ['tenlop', 'classname']));
    const programName = cellText(getByAliases(record, ['chuongtrinh', 'program', 'programname']));
    const teacherName = cellText(getByAliases(record, ['giaovien', 'teacher']));
    const roomName = cellText(getByAliases(record, ['phong', 'room']));
    const schedule = cellText(getByAliases(record, ['lichhoc', 'schedule']));
    const timeMatch = schedule.match(/\(([^)]+)\)\s*$/);
    const individualSlots = [...schedule.matchAll(/(Thứ [2-7]|Chủ Nhật)\s*:\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g)];
    const days = individualSlots.length
      ? individualSlots.map((match) => match[1])
      : (timeMatch ? schedule.slice(0, timeMatch.index).trim() : schedule).split(',').map((item) => item.trim()).filter(Boolean);
    if (teacherName && !teacherName.toLocaleLowerCase('vi-VN').includes('chưa')) teacherNames.add(teacherName);
    if (roomName && !roomName.toLocaleLowerCase('vi-VN').includes('chưa')) roomNames.add(roomName);
    return { id: `CLASS-IMP-${String(index + 1).padStart(2, '0')}`, code, name, programName, teacherName, roomName, days, scheduleTime: individualSlots.length ? schedule : (timeMatch?.[1] || ''), capacity: numberValue(getByAliases(record, ['succhua', 'capacity'])), studentIds: [] as string[] };
  }).filter((item) => item.code && item.name);

  const teachers: Teacher[] = [...teacherNames].map((name, index) => ({
    id: `TEACHER-IMP-${String(index + 1).padStart(2, '0')}`,
    name,
    phone: '', email: '', address: '', specialty: '', assignedClassIds: [], notes: 'Nhập từ báo cáo Excel.'
  }));
  const rooms: Room[] = [...roomNames].map((name, index) => ({
    id: `ROOM-IMP-${String(index + 1).padStart(2, '0')}`,
    name, capacity: 0, status: 'available', notes: 'Sức chứa chưa được nhập từ báo cáo.'
  }));
  const programs: CourseProgram[] = [];
  const ensureProgram = (rawName: string) => {
    const name = rawName.trim() || 'Chương trình nhập từ Excel';
    const existing = programs.find((program) => program.name.toLocaleLowerCase('vi-VN') === name.toLocaleLowerCase('vi-VN'));
    if (existing) return existing;
    const program: CourseProgram = {
      id: `PROG-IMP-${String(programs.length + 1).padStart(3, '0')}`,
      code: `IMP-${String(programs.length + 1).padStart(3, '0')}`,
      name,
      category: 'Khác',
      tuitionFee: 0,
      description: 'Nhập từ báo cáo Excel.',
    };
    programs.push(program);
    return program;
  };
  const classes: ClassRoom[] = importedClasses.map(({ teacherName, roomName, programName, ...classroom }) => ({
    ...classroom,
    programId: ensureProgram(programName).id,
    teacherId: teachers.find((teacher) => teacher.name === teacherName)?.id || '',
    roomId: rooms.find((room) => room.name === roomName)?.id || ''
  }));
  teachers.forEach((teacher) => { teacher.assignedClassIds = classes.filter((classroom) => classroom.teacherId === teacher.id).map((classroom) => classroom.id); });

  const students: Student[] = [];
  const masterStudentsSheet = workbook.getWorksheet('HỌC SINH');
  if (masterStudentsSheet) {
    const masterRecords = readRecords(masterStudentsSheet, ['mahocsinh', 'hovaten']);
    masterRecords.forEach((record, index) => {
      const code = cellText(getByAliases(record, ['mahocsinh', 'mahs', 'studentcode']));
      const name = cellText(getByAliases(record, ['hovaten', 'hoten', 'name']));
      const classCode = cellText(getByAliases(record, ['malop', 'classcode']));
      const classroom = classes.find((item) => item.code === classCode);
      if (!code || !name || !classroom) return;
      const programName = cellText(getByAliases(record, ['chuongtrinh', 'program', 'programname']));
      const program = programName ? ensureProgram(programName) : null;
      if (program) classroom.programId = program.id;
      const id = cellText(getByAliases(record, ['idhethong', 'systemid'])) || `STU-IMP-MASTER-${String(index + 1).padStart(3, '0')}`;
      students.push({
        id, code, name,
        dob: cellText(getByAliases(record, ['ngaysinh', 'dob'])),
        gender: cellText(getByAliases(record, ['gioitinh', 'gender'])) === 'Nam' ? 'Nam' : (cellText(getByAliases(record, ['gioitinh', 'gender'])) === 'Nữ' ? 'Nữ' : 'Chưa xác định'),
        school: '', gradeLevel: '', programId: program?.id || classroom.programId, classId: classroom.id,
        address: cellText(getByAliases(record, ['diachi', 'address'])), email: '',
        phone: cellText(getByAliases(record, ['sdthocsinh', 'phone'])), parentName: '',
        parentPhone: cellText(getByAliases(record, ['sdtphuhuynh', 'parentphone'])), enrollDate: '', notes: cellText(getByAliases(record, ['ghichu', 'notes'])),
        status: statusFromLabel(getByAliases(record, ['trangthai', 'status'])), feeStatus: 'unpaid',
      });
      classroom.studentIds.push(id);
    });
  }

  if (!students.length) for (const classroom of classes) {
    const detailSheet = workbook.getWorksheet(classSheetName(classroom));
    if (!detailSheet) continue;
    const records = readRecords(detailSheet, ['mahocsinh', 'hovaten']);
    records.forEach((record, index) => {
      const id = cellText(getByAliases(record, ['idhethong', 'systemid'])) || `STU-IMP-${classroom.id}-${String(index + 1).padStart(3, '0')}`;
      const code = cellText(getByAliases(record, ['mahocsinh', 'mahs', 'studentcode']));
      const name = cellText(getByAliases(record, ['hovaten', 'hoten', 'name']));
      if (!code || !name) return;
      students.push({
        id, code, name,
        dob: '', gender: 'Chưa xác định', school: '', gradeLevel: '', programId: classroom.programId, classId: classroom.id,
        address: cellText(getByAliases(record, ['diachi', 'address'])), email: '',
        phone: cellText(getByAliases(record, ['sdthocsinh', 'phone'])), parentName: '',
        parentPhone: cellText(getByAliases(record, ['sdtphuhuynh', 'parentphone'])), enrollDate: '', notes: 'Nhập từ báo cáo Excel.',
        status: statusFromLabel(getByAliases(record, ['trangthai', 'status'])), feeStatus: 'unpaid'
      });
      classroom.studentIds.push(id);
    });
  }
  if (!students.length) {
    return { errors: [{ row: 0, field: 'Sheet lớp', message: 'Không đọc được danh sách học sinh từ các sheet lớp.' }] };
  }

  const studentIds = new Set(students.map((student) => student.id));
  const tuitionRecords = readRecords(tuitionSheet, ['maphieu', 'idhethong']);
  const receipts: TuitionReceipt[] = tuitionRecords.map((record, index) => {
    const studentId = cellText(getByAliases(record, ['idhethong', 'systemid']));
    const student = students.find((item) => item.id === studentId);
    const paidAmount = numberValue(getByAliases(record, ['dathuvnd', 'dathu', 'paidamount']));
    const debtAmount = numberValue(getByAliases(record, ['congnovnd', 'congno', 'debtamount']));
    const paymentKindLabel = cellText(getByAliases(record, ['khoanthu', 'paymentkind'])).toLocaleLowerCase('vi-VN');
    const paymentKind: TuitionReceipt['paymentKind'] = paymentKindLabel.includes('khóa') ? 'course' : 'monthly';
    const discount = numberValue(getByAliases(record, ['giamgiavnd', 'giamgia', 'discount']));
    const rawCourseFee = numberValue(getByAliases(record, ['hocphikhoavnd', 'hocphikhoa', 'coursefee']));
    const rawMonthlyFee = numberValue(getByAliases(record, ['hocphithangvnd', 'hocphithang', 'monthlyfee']));
    const courseFee = paymentKind === 'course' ? rawCourseFee : 0;
    const monthlyFee = paymentKind === 'monthly' ? (rawMonthlyFee || (paidAmount + debtAmount + discount)) : rawMonthlyFee;
    const billingPeriod = monthKey(isoDate(getByAliases(record, ['kyhocphi', 'billingperiod', 'period']) || getByAliases(record, ['ngaythu', 'paymentdate'])));
    const receiptStatus: TuitionReceipt['status'] = debtAmount > 0 ? (paidAmount > 0 ? 'partial' : 'debt') : (paidAmount > 0 ? 'paid' : 'unpaid');
    const paymentMethod = cellText(getByAliases(record, ['hinhthuc', 'paymentmethod']));
    const normalizedPaymentMethod: TuitionReceipt['paymentMethod'] = paymentMethod === 'Tiền mặt' || paymentMethod === 'Chuyển khoản' || paymentMethod === 'Thẻ' ? paymentMethod : 'Chưa xác định';
    return {
      id: `RCPT-IMP-${String(index + 1).padStart(3, '0')}`,
      code: cellText(getByAliases(record, ['maphieu', 'receiptcode'])) || `IMP-${index + 1}`,
      studentId,
      classId: student?.classId || '',
      courseFee,
      monthlyFee,
      paymentKind,
      billingPeriod,
      discount,
      paidAmount,
      debtAmount,
      status: receiptStatus,
      paymentDate: isoDate(getByAliases(record, ['ngaythu', 'paymentdate'])),
      collectorName: '',
      paymentMethod: normalizedPaymentMethod,
      notes: cellText(getByAliases(record, ['ghichu', 'notes']))
    };
  }).filter((receipt) => studentIds.has(receipt.studentId));
  students.forEach((student) => {
    const studentReceipts = receipts.filter((receipt) => receipt.studentId === student.id);
    const debt = studentReceipts.reduce((sum, receipt) => sum + receipt.debtAmount, 0);
    const paid = studentReceipts.reduce((sum, receipt) => sum + receipt.paidAmount, 0);
    student.feeStatus = debt > 0 ? (paid > 0 ? 'partial' : 'debt') : (paid > 0 ? 'paid' : 'unpaid');
  });
  const timetableSlots = classes.flatMap((classroom) => {
    const individualSlots = [...classroom.scheduleTime.matchAll(/(Thứ [2-7]|Chủ Nhật)\s*:\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g)];
    if (individualSlots.length) return individualSlots.map((match, index) => ({ id: `SLOT-IMP-${classroom.id}-${index + 1}`, classId: classroom.id, teacherId: classroom.teacherId, roomId: classroom.roomId, dayOfWeek: match[1], startTime: match[2], endTime: match[3] }));
    const [startTime = '', endTime = ''] = classroom.scheduleTime.split('-').map((item) => item.trim());
    return classroom.days.map((dayOfWeek, index) => ({ id: `SLOT-IMP-${classroom.id}-${index + 1}`, classId: classroom.id, teacherId: classroom.teacherId, roomId: classroom.roomId, dayOfWeek, startTime, endTime }));
  });
  return { data: { programs, teachers, rooms, classes, students, timetableSlots, grades: [], receipts }, errors: [] };
}
