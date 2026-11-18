import assert from "node:assert/strict";
import {
  isReceiptSubjectToNewRules,
  newReceiptCodeConflicts,
  newTuitionOverpayments,
} from "../src/lib/receiptPolicy";
import {
  applyCenterChanges,
  canonicalCenter,
  type CenterActor,
} from "../server/centerPolicy";
import { checkDataConsistency } from "../src/services/dataConsistencyService";
import { initialSettings } from "../src/mock/initialData";
import type { CenterBackupData, TuitionReceipt } from "../src/types";

const receipt = (
  id: string,
  overrides: Partial<TuitionReceipt> = {},
): TuitionReceipt => ({
  id,
  code: "PT-2026-100",
  studentId: "s1",
  classId: "c1",
  monthlyFee: 500000,
  courseFee: 0,
  paymentKind: "monthly",
  billingPeriod: "2026-10",
  discount: 0,
  paidAmount: 500000,
  debtAmount: 0,
  status: "paid",
  paymentDate: "2026-10-09",
  collectorName: "Synthetic Owner",
  paymentMethod: "Tiền mặt",
  ...overrides,
});
const old = [receipt("r1"), receipt("r2", { paymentDate: "2026-10-10" })];
assert.equal(isReceiptSubjectToNewRules({ paymentDate: "2026-11-18" }), false);
assert.equal(isReceiptSubjectToNewRules({ paymentDate: "2026-11-19" }), true);
assert.equal(isReceiptSubjectToNewRules({ paymentDate: "2026-11-20" }), true);
assert.deepEqual(newReceiptCodeConflicts(old), []);
assert.deepEqual(newTuitionOverpayments(old), []);

const snapshot = canonicalCenter({
  settings: initialSettings,
  receipts: old,
  students: [
    {
      id: "s1",
      code: "HS001",
      name: "Synthetic Student",
      classId: "c1",
      extraClassIds: [],
      programId: "",
      status: "active",
    },
  ],
  classes: [
    {
      id: "c1",
      code: "C1",
      name: "Synthetic Class",
      programId: "",
      teacherId: "",
      roomId: "",
      studentIds: ["s1"],
      days: [],
      capacity: 20,
    },
  ],
} as CenterBackupData);
assert.deepEqual(
  checkDataConsistency(
    snapshot.students,
    snapshot.classes,
    snapshot.receipts,
    [],
  ),
  [],
);
const original = structuredClone(snapshot);
const actor: CenterActor = {
  id: "owner",
  full_name: "Synthetic Owner",
  role: "owner",
  is_active: true,
  permissions: {},
};
const fresh = receipt("r3", {
  code: "PT-2026-101",
  paymentDate: "2026-11-19",
  billingPeriod: "2026-11",
});
const result = applyCenterChanges(
  snapshot,
  { collections: { receipts: { upsert: [fresh], remove: [] } } },
  actor,
  "new-valid",
).payload;
assert.deepEqual(
  result.receipts.filter((row) => row.id !== "r3"),
  original.receipts,
  "Saving a new receipt must preserve all historical receipt fields",
);
assert.deepEqual(
  snapshot,
  original,
  "Validation must not mutate the source snapshot",
);
assert.equal(result.receipts.length, 3);

const duplicate = { ...fresh, code: " pt-2026-100 " };
assert.equal(newReceiptCodeConflicts([...old, duplicate]).length, 1);
assert.throws(
  () =>
    applyCenterChanges(
      snapshot,
      { collections: { receipts: { upsert: [duplicate], remove: [] } } },
      actor,
      "duplicate",
    ),
  /duy nhất/,
);
const excess = receipt("r3", {
  code: "PT-2026-102",
  paymentDate: "2026-11-19",
  paidAmount: 100000,
});
const groups = newTuitionOverpayments([...old, excess]);
assert.equal(groups.length, 1);
assert.equal(groups[0].historicalExcess, 500000);
assert.equal(
  groups[0].excess,
  100000,
  "Only the additional excess after the effective date is counted",
);
assert.throws(
  () =>
    applyCenterChanges(
      snapshot,
      { collections: { receipts: { upsert: [excess], remove: [] } } },
      actor,
      "excess",
    ),
  /vượt học phí/,
);
assert.deepEqual(
  newTuitionOverpayments([...old, { ...excess, paidAmount: 0 }]),
  [],
  "A historical discrepancy alone must not trigger a new warning",
);
const backdated = receipt("r3", {
  code: "PT-2026-103",
  paymentDate: "2026-11-18",
});
assert.doesNotThrow(() =>
  applyCenterChanges(
    snapshot,
    { collections: { receipts: { upsert: [backdated], remove: [] } } },
    actor,
    "historical-import",
  ),
);
console.log(
  "Passed: receipt cutoff is inclusive on 19/11/2026, historical anomalies are grandfathered, new code/payment violations are rejected, and old receipt fields are preserved.",
);
