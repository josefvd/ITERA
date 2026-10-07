import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionTransactionStatus } from "../src/lib/transaction-status.ts";

test("scheduled payment rejects malformed timestamps rather than trusting the date prefix", () => {
  const now = new Date("2026-10-01T12:00:00.000Z");
  assert.equal(canTransitionTransactionStatus("scheduled", "paid", "2026-10-01junk", now), false);
  assert.equal(canTransitionTransactionStatus("scheduled", "paid", "2026-10-01T25:00:00Z", now), false);
});

test("permite solo Creada→Pagada o Creada→Programada→Pagada", () => {
  const now = new Date("2026-10-01T12:00:00.000Z");
  assert.equal(canTransitionTransactionStatus("pending", "paid"), true);
  assert.equal(canTransitionTransactionStatus("pending", "scheduled"), true);
  assert.equal(canTransitionTransactionStatus("scheduled", "paid", "2026-10-02", now), false);
  assert.equal(canTransitionTransactionStatus("scheduled", "paid", "2026-10-01", now), true);
  assert.equal(canTransitionTransactionStatus("scheduled", "paid", null, now), false);
  assert.equal(canTransitionTransactionStatus("scheduled", "paid", "2026-02-30", now), false);
  assert.equal(canTransitionTransactionStatus("scheduled", "paid", new Date("invalid"), now), false);
  assert.equal(canTransitionTransactionStatus("pending", "completed"), false);
  assert.equal(canTransitionTransactionStatus("scheduled", "pending"), false);
  assert.equal(canTransitionTransactionStatus("paid", "scheduled"), false);
});
