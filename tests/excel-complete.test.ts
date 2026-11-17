import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import CFB from 'cfb';
import {decompressVba} from '../scripts/build-excel-template.mjs';
import { generateMasterExcelWorkbook, parseCenterWorkbookFile, type ExcelExportData } from '../src/services/excelService';
import type {Student} from '../src/types';

const student: Student = {id:'student-1',code:'HS001',name:'Học viên có lớp',dob:'2015-02-03',gender:'Nữ',school:'Trường A',gradeLevel:'Lớp 5',
  programId:'program-1',classId:'class-1',extraClassIds:[],address:'Địa chỉ',email:'student@example.test',phone:'0901000000',
  parentName:'Phụ huynh A',parentPhone:'0902000000',parentConsent:false,enrollDate:'2026-11-17',avatar:'https://example.test/avatar.png',notes:'Ghi chú',status:'active',feeStatus:'paid'};
const pending: Student = {...student,id:'student-2',code:'HS002',name:'Học viên chưa xếp lớp',programId:'',classId:'',parentConsent:true,feeStatus:'unpaid'};
const data = {centerName:'Excel regression',students:[student,pending],
  programs:[{id:'program-1',code:'ENG',name:'English',category:'Khác',tuitionFee:500000,description:'Program note'}],
  teachers:[{id:'teacher-1',name:'Giáo viên A',phone:'0903000000',email:'teacher@example.test',address:'Teacher address',specialty:'English',assignedClassIds:['class-1'],scheduleNotes:'Schedule note',avatar:'avatar',notes:'Teacher note'}],
  rooms:[{id:'room-1',name:'Phòng A',capacity:25,status:'available',notes:'Room note'}],
  classes:[{id:'class-1',code:'L01',name:'Lớp 1',programId:'program-1',teacherId:'teacher-1',roomId:'room-1',days:['Thứ 2'],scheduleTime:'18:00 - 19:30',capacity:20,studentIds:['student-1']}],
  timetableSlots:[{id:'slot-1',classId:'class-1',teacherId:'teacher-1',roomId:'room-1',dayOfWeek:'Thứ 2',startTime:'18:00',endTime:'19:30'}],
  grades:[{id:'grade-1',studentId:'student-1',classId:'class-1',listening:8,speaking:8,reading:8,writing:8,midterm:8,finalExam:8,attendance:8,average:8}],
  receipts:[{id:'receipt-1',code:'PT001',studentId:'student-1',classId:'class-1',paymentKind:'monthly',courseFee:0,monthlyFee:500000,billingPeriod:'2026-11',discount:0,paidAmount:500000,debtAmount:0,paymentDate:'2026-11-17',collectorName:'Collector',paymentMethod:'Tiền mặt',notes:'Receipt note'}],
} as ExcelExportData;

globalThis.fetch = async () => new Response(await fs.readFile('public/excel/PhucPhucThinhSyncTemplate.xlsm'));
const bytes = Buffer.from(await (await generateMasterExcelWorkbook(data)).arrayBuffer());
const parse = async (book?: ExcelJS.Workbook) => parseCenterWorkbookFile(new File([book ? Buffer.from(await book.xlsx.writeBuffer()) : bytes],'test.xlsm'));
const result = await parse();
assert.deepEqual(result.errors,[]);
assert.deepEqual(result.data!.students,data.students);
assert.deepEqual(result.data!.classes,data.classes);
assert.deepEqual(result.data!.teachers,data.teachers);
assert.deepEqual(result.data!.programs,data.programs);
assert.deepEqual(result.data!.rooms,data.rooms);
assert.deepEqual(result.data!.grades,data.grades);
assert.deepEqual(result.data!.timetableSlots,data.timetableSlots);
assert.equal(result.data!.receipts[0].id,'receipt-1');

const book = new ExcelJS.Workbook(); await book.xlsx.load(bytes as any);
const master = book.getWorksheet('HỌC SINH')!;
master.getCell('AA7').value = 'Phụ huynh đã sửa';
master.getCell('AB7').value = '';
master.getCell('F7').value = '';
master.getCell('G7').value = '';
master.getCell('E6').value = new Date('2015-02-03T00:00:00Z');
// Imported ExcelJS style objects may be shared with numeric cells on other sheets.
master.getCell('E6').style = {...master.getCell('E6').style,numFmt:'dd/mm/yyyy'};
master.getCell('AE6').value = new Date('2026-11-17T00:00:00Z');
master.getCell('AE6').style = {...master.getCell('AE6').style,numFmt:'dd/mm/yyyy'};
const edited = await parse(book);
assert.deepEqual(edited.errors,[]);
assert.equal(edited.data!.students[1].parentName,'Phụ huynh đã sửa');
assert.equal(edited.data!.students[1].school,'','An intentionally cleared field must stay blank');
assert.equal(edited.data!.students[0].dob,'2015-02-03');
assert.equal(edited.data!.students[0].enrollDate,'2026-11-17');
master.getCell('G7').value = 'UNKNOWN';
const badClass = await parse(book);
assert.equal(badClass.recognized,true);
assert.ok(badClass.errors.length);
assert.equal(badClass.data,undefined,'Unknown classes must not silently drop students');
master.getCell('G7').value = '';
master.getCell('M7').value = -1;
assert.ok((await parse(book)).errors.length,'Negative direct payments must be rejected');
master.getCell('M7').value = 0;
master.spliceRows(7,1);
assert.equal((await parse(book)).data!.students.length,1,'Deleted rows must not be restored from metadata');
book.getWorksheet('BẢNG ĐIỂM')!.getCell('E6').value = 10;
assert.equal((await parse(book)).data!.grades[0].average,8.2,'A stale cached average must not override edited scores');

const zip = await JSZip.loadAsync(bytes);
const summaryXml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
assert.match(summaryXml,/<hyperlink ref="B10" location="&apos;|<hyperlink ref="B10" location="'/);
assert.match(summaryXml,/<c r="B10"[^>]*>.*?<f>/);
assert.ok(zip.file('xl/vbaProject.bin'),'The exported file must include the reviewed sync macro');
const macroProject = CFB.read(await zip.file('xl/vbaProject.bin')!.async('nodebuffer'),{type:'buffer'});
const moduleIndex = macroProject.FullPaths.findIndex(path => path.endsWith('/VBA/SyncEngine'));
const bundledSource = decompressVba(macroProject.FileIndex[moduleIndex].content).toString('latin1').replace(/\r\n/g,'\n');
assert.ok(bundledSource.includes((await fs.readFile('excel-macros/SyncEngine.bas','utf8')).replace(/\r\n/g,'\n')),'The binary template must match the reviewed VBA source');

const empty = {...data,students:[],classes:[],receipts:[],grades:[],timetableSlots:[]};
const emptyBytes = Buffer.from(await (await generateMasterExcelWorkbook(empty)).arrayBuffer());
const emptyResult = await parseCenterWorkbookFile(new File([emptyBytes],'empty.xlsm'));
assert.deepEqual(emptyResult.errors,[]);
assert.equal(emptyResult.data!.students.length,0);
assert.equal(emptyResult.data!.classes.length,0);

const large = {...data,grades:[],receipts:[],students:Array.from({length:1050},(_,index)=>({...pending,id:`large-${index}`,code:`LARGE-${index}`}))};
const largeBytes = Buffer.from(await (await generateMasterExcelWorkbook(large)).arrayBuffer());
const largeZip = await JSZip.loadAsync(largeBytes);
const workbookXml = await largeZip.file('xl/workbook.xml')!.async('string');
assert.match(workbookXml,/name="PPTE_HS_B"[^>]*>[^<]*\$B\$1055/);
assert.equal((await parseCenterWorkbookFile(new File([largeBytes],'large.xlsm'))).data!.students.length,1050);
console.log('Passed: complete student/catalog/grade/timetable round trip, unassigned students, explicit clearing/deletion, validation, numeric hyperlinks, empty data, and 1050-student workbook.');
