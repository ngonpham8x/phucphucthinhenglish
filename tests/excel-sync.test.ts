import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';
import { generateMasterExcelWorkbook, parseCenterWorkbookFile } from '../src/services/excelService';
import type { ExcelExportData } from '../src/services/excelService';
const data = {
 centerName: 'Regression', programs: [{id:'p',name:'English',tuitionFee:4000000}], teachers:[], rooms:[], grades:[],
 classes: ['10','11'].map(id=>({id,code:id,name:'Class '+id,programId:'p',teacherId:'',roomId:'',days:[],capacity:10,studentIds:['A']})),
 students: [{id:'A',code:'A',name:'Student A',classId:'10',extraClassIds:['11'],programId:'p',gender:'Nam',dob:'2015-01-01',phone:'',parentPhone:'',address:'',status:'active',feeStatus:'partial'}],
 receipts: [
 {id:'r1',code:'PT1',studentId:'A',classId:'10',courseFee:4000000,paymentKind:'course',billingPeriod:'2026',discount:0,paidAmount:2000000,debtAmount:0,paymentDate:'2026-08-10',paymentMethod:'Tiền mặt',collectorName:'Test'},
 {id:'r2',code:'PT2',studentId:'A',classId:'10',courseFee:4000000,paymentKind:'course',billingPeriod:'2026',discount:0,paidAmount:2000000,debtAmount:0,paymentDate:'2026-10-10',paymentMethod:'Tiền mặt',collectorName:'Test'},
 {id:'r3',code:'PT3',studentId:'A',classId:'11',courseFee:0,monthlyFee:1000000,paymentKind:'monthly',billingPeriod:'2026-10',discount:0,paidAmount:500000,debtAmount:500000,paymentDate:'2026-10-10',paymentMethod:'Tiền mặt',collectorName:'Test'}]
} as ExcelExportData;
globalThis.fetch = async () => new Response(await fs.readFile('public/excel/PhucPhucThinhSyncTemplate.xlsm'));
const blob = await generateMasterExcelWorkbook(data);
const bytes = Buffer.from(await blob.arrayBuffer());
await fs.mkdir('.review',{recursive:true});
await fs.writeFile('.review/excel-sync-fixture.xlsm',bytes);
const book = new ExcelJS.Workbook(); await book.xlsx.load(bytes as any);
assert.equal(book.getWorksheet('HỌC SINH')!.getCell('G6').text,'10, 11');
assert.match(book.getWorksheet('Lớp 11')!.getCell('G12').formula, /\$F\$6:\$F\$1000,"11"/);
const result = await parseCenterWorkbookFile(new File([bytes],'test.xlsm'));
assert.deepEqual(result.errors,[]);
assert.equal(result.data!.students.length,1);
assert.equal(result.data!.students[0].extraClassIds!.length,1);
assert.equal(result.data!.receipts.length,3);
console.log('Passed: multiple-class export/import, class-specific financial formulas, receipt round trip.');

assert.deepEqual(result.data!.receipts.map(r => r.id).sort(),['r1','r2','r3']);
assert.ok(result.data!.receipts.every(r => r.collectorName === 'Test'));
assert.equal(book.getWorksheet('HỌC PHÍ')!.getCell('O6').value instanceof Date,true);
assert.equal((book.getWorksheet('HỌC PHÍ')!.getCell('O6').value as Date).toISOString().slice(0,10),'2026-08-10');
const parseBook = async () => parseCenterWorkbookFile(new File([Buffer.from(await book.xlsx.writeBuffer())],'edited.xlsx'));
book.getWorksheet('HỌC PHÍ')!.getCell('B8').value = 'PT1';
const legacyDuplicate = await parseBook();
assert.deepEqual(legacyDuplicate.errors,[]);
assert.equal(legacyDuplicate.data!.receipts.length,3);
book.getWorksheet('HỌC PHÍ')!.getCell('T8').value = null;
assert.ok((await parseBook()).errors.length > 0,'Ambiguous duplicate code must be rejected');
book.getWorksheet('HỌC PHÍ')!.getCell('B8').value = 'PT3';
book.getWorksheet('HỌC PHÍ')!.getCell('C6').value = 'wrong-student-id';
assert.ok((await parseBook()).errors.length > 0,'Wrong ID must not fall back to a different student code');
book.getWorksheet('HỌC PHÍ')!.getCell('C6').value = 'A';
book.getWorksheet('HỌC PHÍ')!.getCell('F6').value = 'unknown-class';
assert.ok((await parseBook()).errors.length > 0,'Unknown class must not silently use primary class');
console.log('Passed: stable receipt IDs, collector, Excel dates, historical duplicate codes, invalid student/class references.');

book.getWorksheet('HỌC PHÍ')!.getCell('F6').value = '10';
book.getWorksheet('HỌC PHÍ')!.getCell('L6').value = -1;
assert.ok((await parseBook()).errors.length > 0,'Negative imported payment must be rejected');
