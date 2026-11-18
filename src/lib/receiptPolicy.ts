import type { TuitionReceipt } from "../types.js";
import { tuitionOverpayments } from "./tuition.js";

// The effective date refers to the receipt's local calendar payment date.
export const RECEIPT_RULES_START_DATE = "2026-11-19";

export const isReceiptSubjectToNewRules = (
  receipt: Pick<TuitionReceipt, "paymentDate">,
) =>
  typeof receipt.paymentDate === "string" &&
  receipt.paymentDate >= RECEIPT_RULES_START_DATE;

export function newReceiptCodeConflicts(receipts: TuitionReceipt[]) {
  const codes = new Map<string, TuitionReceipt[]>();
  for (const receipt of receipts) {
    const key = receipt.code.trim().toLocaleUpperCase("vi-VN");
    const group = codes.get(key) || [];
    group.push(receipt);
    codes.set(key, group);
  }
  return [...codes.values()].filter(
    (group) => group.length > 1 && group.some(isReceiptSubjectToNewRules),
  );
}

export function newTuitionOverpayments(receipts: TuitionReceipt[]) {
  const historical = new Map(
    tuitionOverpayments(
      receipts.filter((receipt) => !isReceiptSubjectToNewRules(receipt)),
    ).map((group) => [group.key, group.excess]),
  );
  return tuitionOverpayments(receipts)
    .map((group) => ({
      ...group,
      historicalExcess: historical.get(group.key) || 0,
      excess: Math.max(group.excess - (historical.get(group.key) || 0), 0),
    }))
    .filter((group) => group.excess > 0);
}
