import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedTransactionStatus,
  transactionActionMessages,
  getTransactionFlowSteps,
} from "../src/lib/transaction-status.ts";

test("paid scheduled transactions preserve the scheduled step in their timeline", () => {
  assert.deepEqual(getTransactionFlowSteps("paid", "2026-10-02T00:00:00.000Z"), ["Creada", "Programada", "Pagada"]);
  assert.deepEqual(getTransactionFlowSteps("scheduled", "2026-10-02T00:00:00.000Z"), ["Creada", "Programada", "Pagada"]);
  assert.deepEqual(getTransactionFlowSteps("paid", null), ["Creada", "Pagada"]);
});

test("completed transactions show a completed timeline step, not a paid step", () => {
  assert.deepEqual(getTransactionFlowSteps("completed"), ["Creada", "Completada"]);
  assert.deepEqual(getTransactionFlowSteps("completed", "2026-10-02T00:00:00.000Z"), ["Creada", "Programada", "Completada"]);
});

test("permite solo estados reales para acciones de transacción", () => {
  assert.equal(isAllowedTransactionStatus("pending"), true);
  assert.equal(isAllowedTransactionStatus("completed"), true);
  assert.equal(isAllowedTransactionStatus("failed"), true);
  assert.equal(isAllowedTransactionStatus("cancelled"), true);
  assert.equal(isAllowedTransactionStatus("approved"), false);
  assert.equal(isAllowedTransactionStatus(""), false);
});

test("expone mensajes en español para las acciones operativas", () => {
  assert.equal(
    transactionActionMessages.completed,
    "Transacción completada."
  );
  assert.equal(transactionActionMessages.failed, "Transacción marcada para disputa.");
  assert.equal(transactionActionMessages.cancelled, "Transacción anulada.");
});
