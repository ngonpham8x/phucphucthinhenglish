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
