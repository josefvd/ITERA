import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedTransactionStatus,
  transactionActionMessages,
} from "../src/lib/transaction-status.ts";

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
    "Pago aprobado y proveedor notificado."
  );
  assert.equal(transactionActionMessages.failed, "Transacción marcada para disputa.");
  assert.equal(transactionActionMessages.cancelled, "Transacción anulada.");
});
