import test from "node:test";
import assert from "node:assert/strict";
import { validateTransactionInput, validateStatusUpdate } from "../src/lib/transaction-form.ts";

const now = new Date("2035-05-10T12:00:00.000Z");
const valid = {
  vendorId: "vendor-fixture-1",
  amount: "120.50",
  paymentMethod: "local_transfer",
  serviceType: "Flete marítimo",
  referenceType: "BOL",
  referenceNumber: "REF-123",
  relatedReference: "AWB-456",
  commercialValue: "999.99",
  paymentTiming: "scheduled",
  scheduledFor: "2035-05-11",
  description: "Nota interna",
};

test("normaliza campos transaccionales estructurados y fecha futura", () => {
  assert.deepEqual(validateTransactionInput(valid, now), {
    ok: true,
    value: {
      vendorId: "vendor-fixture-1",
      amount: 120.5,
      paymentMethod: "local_transfer",
      serviceType: "Flete marítimo",
      referenceType: "BOL",
      referenceNumber: "REF-123",
      relatedReference: "AWB-456",
      commercialValue: 999.99,
      paymentTiming: "scheduled",
      scheduledFor: "2035-05-11T00:00:00.000Z",
      description: "Nota interna",
      status: "scheduled",
    },
  });
});

test("rechaza entradas tipadas incorrectamente, fuera de límites o sin fecha programada futura", () => {
  for (const input of [
    { ...valid, vendorId: "" },
    { ...valid, amount: "Infinity" },
    { ...valid, amount: true },
    { ...valid, amount: 0 },
    { ...valid, serviceType: "inventado" },
    { ...valid, referenceNumber: " " },
    { ...valid, referenceNumber: "x".repeat(121) },
    { ...valid, commercialValue: "NaN" },
    { ...valid, commercialValue: true },
    { ...valid, paymentTiming: "scheduled", scheduledFor: "2035-05-10" },
    { ...valid, paymentTiming: "ASAP", scheduledFor: "no-es-fecha" }
  ]) assert.equal(validateTransactionInput(input, now).ok, false);
});

test("rechaza montos y valores comerciales con más de dos decimales", () => {
  for (const amount of ["120.501", 120.501, "0.001"]) {
    assert.equal(validateTransactionInput({ ...valid, amount }, now).ok, false);
  }
  for (const commercialValue of ["999.991", 999.991]) {
    assert.equal(validateTransactionInput({ ...valid, commercialValue }, now).ok, false);
  }
  assert.equal(validateTransactionInput({ ...valid, amount: "120.50", commercialValue: "999.99" }, now).ok, true);
});
test("PATCH exige fecha futura solo para la transición a scheduled", () => {
  assert.deepEqual(validateStatusUpdate("scheduled", undefined, now), { ok: false });
  assert.deepEqual(validateStatusUpdate("scheduled", "2035-05-10", now), { ok: false });
  assert.deepEqual(validateStatusUpdate("scheduled", "2035-05-11", now), {
    ok: true,
    scheduledFor: "2035-05-11T00:00:00.000Z",
  });
  assert.deepEqual(validateStatusUpdate("paid", undefined, now), { ok: true, scheduledFor: null });
});
