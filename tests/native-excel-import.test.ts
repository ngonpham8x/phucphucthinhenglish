import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseCenterWorkbookFile} from '../src/services/excelService';

// This file was saved by real Excel after the native mutation/event tests.
const bytes = await fs.readFile('.review/excel-native-edited.xlsm');
const result = await parseCenterWorkbookFile(new File([bytes],'excel-native-edited.xlsm'));
assert.deepEqual(result.errors,[]);
assert.equal(result.data!.students.find(student => student.id === 'A')!.code,'A-RENAMED');
assert.equal(result.data!.students.find(student => student.id === 'A')!.name,'Saved immediately');
assert.equal(result.data!.classes.find(classroom => classroom.id === '11')!.code,'11-RENAMED');
assert.equal(result.data!.receipts.find(receipt => receipt.id === 'r3')!.billingPeriod,'2026-10');
assert.equal(result.data!.receipts.find(receipt => receipt.code === 'NEW-PAYMENT')!.billingPeriod,'2027-01');
assert.equal(result.data!.grades.find(grade => grade.studentId === 'A' && grade.classId === '10')!.average,0.9);
console.log('Passed: native Excel Save As imports back into the website with stable IDs, renamed codes, original tuition months and matching grade averages.');
