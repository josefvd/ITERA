import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("el formulario selecciona proveedor, muestra correo readonly y nunca presenta el pago como hecho al guardar", async () => {
  const page = await read("../src/app/transactions/new/page.tsx");
  assert.equal((page.match(/<form\b/g) || []).length, 1, "el formulario de proveedor no debe anidarse en el formulario principal");
  assert.doesNotMatch(page, /campos auto-llenados|autollenará los campos/i);
  assert.match(page, /id="vendorId"/);
  assert.match(page, /id="vendorEmail"[\s\S]*?readOnly/);
  assert.match(page, /!form\.vendorEmail\.trim\(\)/);
  assert.match(page, /no tiene correo facturable\. Selecciona otro proveedor o agrega uno con correo válido/i);
  assert.match(page, /Marcar como pagada/);
  assert.doesNotMatch(page, /Revisa el total antes de guardar o aprobar|guardar o aprobar|Guardar y aprobar pago|\["Creada",[^\]]*"Pagada"/i);
  assert.doesNotMatch(page, /Procesa documentos con OCR y conserva el nombre del archivo/i);
  assert.match(page, /Transferencia local/);
  assert.match(page, /Transferencia internacional/);
  assert.match(page, /Tarjeta crédito\/débito/);
});


test("transaction pages do not display fees or totals that are absent from persisted records", async () => {
  const [create, detail] = await Promise.all([
    read("../src/app/transactions/new/page.tsx"),
    read("../src/app/transactions/[id]/page.tsx"),
  ]);
  assert.doesNotMatch(create, /Fee de servicio|const serviceFee|const total =/);
  assert.doesNotMatch(detail, /Fee de servicio|Fee financiero|const serviceFee|const financingFee|const total =/);
});

test("dashboard balance counts transactions marked completed or paid", async () => {
  const dashboard = await read("../src/app/dashboard/page.tsx");
  assert.match(dashboard, /t\.status === "completed" \|\| t\.status === "paid"/);
});

test("transaction aggregates convert PostgreSQL numeric strings before addition", async () => {
  const [transactions, dashboard] = await Promise.all([
    read("../src/app/transactions/page.tsx"),
    read("../src/app/dashboard/page.tsx"),
  ]);
  assert.match(transactions, /sum \+ Number\(tx\.amount\)/);
  assert.match(dashboard, /sum \+ Number\(t\.amount\)/);
});

test("completed transactions mark their timeline complete without calling it paid", async () => {
  const detail = await read("../src/app/transactions/[id]/page.tsx");
  assert.match(detail, /visibleStatus === "paid" \|\| visibleStatus === "completed"/);
});

test("pantallas de transacción no ofrecen ni proclaman aprobación", async () => {
  const [list, detail] = await Promise.all([
    read("../src/app/transactions/page.tsx"),
    read("../src/app/transactions/[id]/page.tsx"),
  ]);
  assert.doesNotMatch(list, /Aprobar|Aprobadas|aprobación/i);
  assert.doesNotMatch(detail, /Aprobar pago|Aprobada|pago aprobado|aprobación/i);
  assert.match(detail, /canTransitionTransactionStatus\(visibleStatus, "paid", transaction\.scheduledFor\)/);
  assert.match(detail, /\{canMarkPaid && \(/);
});
