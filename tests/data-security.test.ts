import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  applyCenterChanges,
  canonicalCenter,
  projectCenter,
  type CenterActor,
} from "../server/centerPolicy";
import { EMPTY_PERMISSIONS, canExportCenter } from "../src/lib/access";
import { buildCenterChanges } from "../src/lib/centerChanges";
import { nextStudentCode } from "../src/lib/student";
import { initialSettings } from "../src/mock/initialData";
import type { CenterBackupData } from "../src/types";
import { StudentManager } from "../src/components/StudentManager";
import { LanguageProvider } from "../src/context/LanguageContext";
import { checkDataConsistency } from "../src/services/dataConsistencyService";

const owner: CenterActor = {
  id: "owner",
  full_name: "Test Owner",
  role: "owner",
  is_active: true,
  permissions: {},
};
const student = {
  id: "s1",
  code: "HS001",
  name: "Synthetic Student",
  classId: "c1",
  programId: "",
  extraClassIds: [],
  status: "active",
  feeStatus: "debt",
  phone: "0900000000",
  parentName: "Synthetic Parent",
  parentPhone: "0900000001",
  dob: "",
  gender: "Nam",
  school: "",
  gradeLevel: "",
  address: "",
  email: "",
  enrollDate: "",
};
const full = canonicalCenter({
  settings: initialSettings,
  students: [student],
  classes: [
    {
      id: "c1",
      code: "C1",
      name: "Synthetic Class",
      programId: "",
      teacherId: "",
      roomId: "",
      days: [],
      capacity: 20,
      studentIds: ["s1"],
    },
  ],
  receipts: [
    {
      id: "r1",
      code: "PT-2026-001",
      studentId: "s1",
      classId: "c1",
      courseFee: 0,
      monthlyFee: 900000,
      paymentKind: "monthly",
      billingPeriod: "2026-11",
      discount: 0,
      paidAmount: 200000,
      debtAmount: 700000,
      paymentDate: "2026-11-01",
      paymentMethod: "Tiền mặt",
      collectorName: "Test Owner",
    },
  ],
} as CenterBackupData);
const staff: CenterActor = {
  id: "staff",
  full_name: "Test Staff",
  role: "staff",
  is_active: true,
  permissions: structuredClone(EMPTY_PERMISSIONS),
};
assert.deepEqual(projectCenter(full, staff).students, []);
assert.deepEqual(projectCenter(full, staff).receipts, []);
const permissions = structuredClone(EMPTY_PERMISSIONS);
permissions.student.view = true;
permissions.student.edit = true;
staff.permissions = permissions;
const visible = projectCenter(full, staff);
assert.equal(visible.students[0].feeStatus, "unpaid");
assert.deepEqual(visible.receipts, []);
assert.deepEqual(visible.activityLogs, []);
const changed = structuredClone(visible);
changed.students[0].name = "Edited Synthetic Student";
const saved = applyCenterChanges(
  full,
  buildCenterChanges(visible, changed),
  staff,
  "test",
).payload;
assert.equal(saved.students[0].name, "Edited Synthetic Student");
assert.equal(saved.receipts[0].debtAmount, 700000);
assert.equal(saved.students[0].feeStatus, "partial");
assert.equal(saved.activityLogs[0].userName, "Test Staff");
assert.throws(
  () =>
    applyCenterChanges(
      full,
      {
        collections: {
          receipts: { upsert: [{ id: "r1", paidAmount: 900000 }], remove: [] },
        },
      },
      staff,
      "test",
    ),
  /không được phép/,
);
assert.throws(
  () =>
    applyCenterChanges(
      full,
      { settings: { ...initialSettings, name: "Unauthorized" } },
      staff,
      "test",
    ),
  /không được phép/,
);
permissions.tuition.view = true;
const noDebt = projectCenter(full, staff);
assert.equal(noDebt.receipts[0].debtAmount, 0);
assert.equal(noDebt.receipts[0].monthlyFee, 0);
assert.equal(noDebt.receipts[0].paidAmount, 200000);
permissions.tuition.showDebt = true;
permissions.tuition.collect = true;
assert.throws(
  () =>
    applyCenterChanges(
      full,
      {
        collections: {
          receipts: { upsert: [{ id: "r1", paidAmount: 1000000 }], remove: [] },
        },
      },
      staff,
      "test",
    ),
  /vượt học phí/,
);
const paid = applyCenterChanges(
  full,
  {
    collections: {
      receipts: { upsert: [{ id: "r1", paidAmount: 900000 }], remove: [] },
    },
  },
  staff,
  "test",
).payload;
assert.equal(paid.receipts[0].debtAmount, 0);
assert.equal(paid.students[0].feeStatus, "paid");
const historical = structuredClone(full);
historical.receipts[0].paidAmount = 1000000;
assert.doesNotThrow(() =>
  applyCenterChanges(
    historical,
    {
      collections: {
        receipts: {
          upsert: [{ id: "r1", notes: "Đối soát bản gốc" }],
          remove: [],
        },
      },
    },
    owner,
    "legacy",
  ),
);
assert.throws(
  () =>
    applyCenterChanges(
      historical,
      {
        collections: {
          receipts: { upsert: [{ id: "r1", paidAmount: 1100000 }], remove: [] },
        },
      },
      owner,
      "legacy",
    ),
  /vượt học phí/,
);
assert.equal(
  checkDataConsistency(
    historical.students,
    historical.classes,
    historical.receipts,
    historical.programs,
  ).some((issue) => issue.type === "tuition_overpayment"),
  true,
);
assert.throws(
  () =>
    applyCenterChanges(
      full,
      {
        collections: {
          students: { upsert: [{ ...student, id: "duplicate" }], remove: [] },
        },
      },
      owner,
      "test",
    ),
  /Mã bị trùng|trường dữ liệu/,
);
assert.throws(
  () =>
    applyCenterChanges(
      full,
      { collections: { students: { upsert: [], remove: ["s1"] } } },
      owner,
      "test",
    ),
  /không tồn tại/,
);
assert.equal(nextStudentCode([{ code: "HS001" }, { code: "HS003" }]), "HS004");
assert.equal(
  nextStudentCode([{ code: "hs999" }, { code: "custom" }]),
  "HS1000",
);
assert.equal(
  canExportCenter({ role: "staff", permissions: EMPTY_PERMISSIONS }),
  false,
);

const hiddenHtml = renderToStaticMarkup(
  React.createElement(
    LanguageProvider,
    null,
    React.createElement(StudentManager, {
      students: full.students,
      classes: full.classes,
      programs: full.programs,
      teachers: [],
      receipts: full.receipts,
      isOwner: false,
      permissions: EMPTY_PERMISSIONS,
      searchQuery: "",
      setSearchQuery: () => {},
      onAddStudent: () => {},
      onUpdateStudent: () => {},
      onDeleteStudent: () => {},
      onOpenImportExport: () => {},
      onOpenTuition: () => {},
    } as any),
  ),
);
assert.equal(hiddenHtml.includes("700.000"), false);
console.log(
  "Passed: server projections, forbidden field changes, hidden debt preservation, paid balances, unique student codes, and UI debt privacy.",
);
