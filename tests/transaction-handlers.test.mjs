import test from "node:test";
import assert from "node:assert/strict";
import { createTransactionPostHandler, createTransactionPatchHandler, createVendorPostHandler } from "../src/lib/transaction-handlers.ts";

const valid = {
  vendorId: "vendor-1", amount: 12, paymentMethod: "local_transfer", serviceType: "Flete marítimo",
  referenceType: "BOL", referenceNumber: "B-1", paymentTiming: "today",
};
const request = (body) => new Request("http://local/api/transactions", { method: "POST", body, headers: { "content-type": "application/json" } });

test("POST devuelve 400 y no toca el store con JSON roto, null, arrays o primitivos", async () => {
  let calls = 0;
  const handler = createTransactionPostHandler({ getAuth: async () => ({ userId: "user-1" }), create: async () => { calls++; } });
  for (const body of ["{", "null", "[]", '"string"', "3", "true"]) {
    const response = await handler(request(body));
    assert.equal(response.status, 400, body);
    assert.equal(calls, 0, body);
  }
});

test("POST persists validated structured data only after owner-scoped vendor lookup", async () => {
  const events = [];
  const handler = createTransactionPostHandler({
    getAuth: async () => ({ userId: "user-1" }),
    create: async (userId, input) => { events.push([userId, input]); return { id: "tx-1", ...input }; },
  });
  const response = await handler(request(JSON.stringify(valid)));
  assert.equal(response.status, 201);
  assert.equal(events[0][0], "user-1");
  assert.equal(events[0][1].referenceNumber, "B-1");
});

test("POST returns a sanitized 500 when persistence throws", async () => {
  const handler = createTransactionPostHandler({
    getAuth: async () => ({ userId: "user-1" }),
    create: async () => { throw new Error("database detail must not escape"); },
  });
  const response = await handler(request(JSON.stringify(valid)));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "No se pudo crear la transacción" });
});

test("POST returns 500 when persistence does not return a transaction row", async () => {
  const handler = createTransactionPostHandler({
    getAuth: async () => ({ userId: "user-1" }),
    create: async () => undefined,
  });
  const response = await handler(request(JSON.stringify(valid)));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "No se pudo crear la transacción" });
});
test("PATCH returns 400 without store access for malformed and non-object JSON", async () => {
  let calls = 0;
  const handler = createTransactionPatchHandler({ getAuth: async () => ({ userId: "user-1" }), update: async () => { calls++; } });
  for (const body of ["{", "null", "[]", '"x"', "false"]) {
    const response = await handler(request(body));
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  }
});

test("PATCH returns a sanitized 500 when persistence throws", async () => {
  const handler = createTransactionPatchHandler({
    getAuth: async () => ({ userId: "user-1" }),
    update: async () => { throw new Error("database detail must not escape"); },
  });
  const response = await handler(request(JSON.stringify({ status: "paid" })), "tx-1");
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "No se pudo actualizar la transacción" });
});

test("PATCH surfaces compare-and-set conflict from injected store", async () => {
  let row = { id: "tx-1", userId: "user-1", status: "pending" };
  const handler = createTransactionPatchHandler({
    getAuth: async () => ({ userId: "user-1" }),
    update: async ({ nextStatus }) => {
      if (row.status !== "pending") return { kind: "conflict" };
      row = { ...row, status: nextStatus };
      return { kind: "updated", transaction: row };
    },
  });
  const body = JSON.stringify({ status: "paid" });
  const [first, second] = await Promise.all([
    handler(new Request("http://local/api/transactions/tx-1", { method: "PATCH", body, headers: { "content-type": "application/json" } })),
    handler(new Request("http://local/api/transactions/tx-1", { method: "PATCH", body, headers: { "content-type": "application/json" } })),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
});

test("vendor POST devuelve 400 y no toca DB con JSON inválido o no objeto", async () => {
  let calls = 0;
  const handler = createVendorPostHandler({ getAuth: async () => ({ userId: "user-1" }), create: async () => { calls++; return {}; } });
  for (const body of ["{", "null", "[]", '"texto"', "false"]) {
    const response = await handler(request(body));
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  }
});
test("POST rejects arbitrary referenceType values", async () => {
  const handler = createTransactionPostHandler({ getAuth: async () => ({ userId: "user-1" }), create: async () => ({ id: "tx-1" }) });
  for (const referenceType of ["Other", "awb", "made-up"]) {
    const response = await handler(request(JSON.stringify({ ...valid, referenceType })));
    assert.equal(response.status, 400);
  }
  for (const referenceType of [undefined, null, "", "AWB", "BOL", "Factura", "Otro"]) {
    const response = await handler(request(JSON.stringify({ ...valid, referenceType })));
    assert.equal(response.status, 201);
  }
});

test("vendor POST returns 500 when persistence does not return a saved row", async () => {
  const handler = createVendorPostHandler({
    getAuth: async () => ({ userId: "user-1" }),
    create: async () => undefined,
  });
  const response = await handler(request(JSON.stringify({ name: "Proveedor", billingEmail: "ops@example.com" })));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "No se pudo crear el proveedor" });
});

test("vendor POST returns a sanitized 500 when persistence throws", async () => {
  const handler = createVendorPostHandler({
    getAuth: async () => ({ userId: "user-1" }),
    create: async () => { throw new Error("database detail must not escape"); },
  });
  const response = await handler(request(JSON.stringify({ name: "Proveedor", billingEmail: "ops@example.com" })));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "No se pudo crear el proveedor" });
});

test("vendor POST accepts a standard billing email containing s", async () => {
  const handler = createVendorPostHandler({
    getAuth: async () => ({ userId: "user-1" }),
    create: async (_userId, vendor) => ({ id: "vendor-1", ...vendor }),
  });
  const response = await handler(request(JSON.stringify({ name: "Proveedor ficticio", billingEmail: "ops@example.com" })));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).vendor.billingEmail, "ops@example.com");
});
