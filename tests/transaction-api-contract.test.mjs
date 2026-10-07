import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("creación persiste datos estructurados y confía en el proveedor del usuario, no en campos cliente", async () => {
  const route = await read("../src/app/api/transactions/route.ts");
  assert.match(route, /vendorId/);
  assert.match(route, /WHERE id = \$\{value\.vendorId\} AND "userId" = \$\{userId\}/);
  assert.match(route, /"serviceType"/);
  assert.match(route, /"referenceType"/);
  assert.match(route, /"referenceNumber"/);
  assert.match(route, /"relatedReference"/);
  assert.match(route, /"commercialValue"/);
  assert.match(route, /"scheduledFor"/);
  assert.doesNotMatch(route, /INSERT INTO "Transaction"[^]*\$\{vendorName\}[^]*\$\{vendorEmail/);
});

test("transaction POST returns the persisted row from its INSERT", async () => {
  const route = await read("../src/app/api/transactions/route.ts");
  assert.match(route, /INSERT INTO "Transaction"[\s\S]*RETURNING id,[\s\S]*"updatedAt"/);
  assert.doesNotMatch(route, /FROM "Transaction" WHERE id = \$\{id\}/);
});
test("PATCH usa compare-and-set de estado y persiste la fecha programada", async () => {
  const handler = await read("../src/lib/transaction-handlers.ts");
  const route = await read("../src/app/api/transactions/[id]/route.ts");
  assert.match(handler, /validateStatusUpdate\(status, scheduledFor/);
  assert.match(route, /SELECT status, "scheduledFor"/);
  assert.match(route, /canTransitionTransactionStatus\(existing\.status, nextStatus, existing\.scheduledFor\)/);
  assert.match(route, /"scheduledFor" = CASE WHEN[^]*scheduledFor/);
  assert.match(route, /AND status = \$\{existing\.status\}/);
  assert.match(route, /kind: "conflict"/);
});

test("Neon schema changes are release-time SQL, never route-time DDL", async () => {
  const [transactions, transaction, vendors, migration, canonical] = await Promise.all([
    read("../src/app/api/transactions/route.ts"),
    read("../src/app/api/transactions/[id]/route.ts"),
    read("../src/app/api/vendors/route.ts"),
    read("../scripts/migrations/20261003000000_transaction_form_directory.sql"),
    read("../prisma/schema.sql"),
  ]);
  for (const route of [transactions, transaction, vendors]) {
    assert.doesNotMatch(route, /ensureTransactionSchema|CREATE TABLE|ALTER TABLE/);
  }
  assert.match(migration, /ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY \("userId"\) REFERENCES "User"\(id\)/);
  assert.match(migration, /ADD CONSTRAINT "Transaction_vendorId_userId_fkey"[\s\S]*FOREIGN KEY \("vendorId",\s*"userId"\)/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "vendorId"/);
  assert.match(canonical, /CREATE TABLE IF NOT EXISTS "Vendor"/);
});
test("Prisma local vendor relation and Neon tenant-aware foreign keys are documented", async () => {
  const [prisma, sql, migration] = await Promise.all([
    read("../prisma/schema.prisma"),
    read("../prisma/schema.sql"),
    read("../scripts/migrations/20261003000000_transaction_form_directory.sql"),
  ]);
  assert.match(prisma, /model Vendor\s*\{[^}]*user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s);
  assert.match(prisma, /model Vendor\s*\{[^}]*transactions\s+Transaction\[\]/s);
  assert.match(prisma, /model Transaction\s*\{[^}]*vendor\s+Vendor\?\s+@relation\(fields:\s*\[vendorId\],\s*references:\s*\[id\],\s*onDelete:\s*SetNull\)/s);
  assert.match(sql, /"userId" TEXT NOT NULL REFERENCES "User"\(id\) ON DELETE CASCADE/);
  assert.match(sql, /FOREIGN KEY \("vendorId",\s*"userId"\)\s*REFERENCES "Vendor"\(id,\s*"userId"\)\s*ON DELETE SET NULL \("vendorId"\)/);
  assert.match(migration, /"userId"\) REFERENCES "User"\(id\) ON DELETE CASCADE/);
  assert.match(migration, /FOREIGN KEY \("vendorId",\s*"userId"\)\s*REFERENCES "Vendor"\(id,\s*"userId"\)\s*ON DELETE SET NULL \("vendorId"\)/);
});

test("transaction monetary columns use fixed two-decimal precision", async () => {
  const [canonical, migration] = await Promise.all([
    read("../prisma/schema.sql"),
    read("../scripts/migrations/20261003000000_transaction_form_directory.sql"),
  ]);
  assert.match(canonical, /"commercialValue" NUMERIC\(12,2\)/);
  assert.match(canonical, /amount NUMERIC\(12,2\)/);
  assert.match(migration, /ALTER COLUMN amount TYPE NUMERIC\(12,2\) USING ROUND\(amount::numeric, 2\)/);
  assert.match(migration, /ALTER COLUMN "commercialValue" TYPE NUMERIC\(12,2\) USING ROUND\("commercialValue"::numeric, 2\)/);
});

test("Neon vendor relationships enforce same-user ownership", async () => {
  const [canonical, migration] = await Promise.all([
    read("../prisma/schema.sql"),
    read("../scripts/migrations/20261003000000_transaction_form_directory.sql"),
  ]);
  assert.match(migration, /(?:^|\n)BEGIN;\n/);
  assert.match(migration, /COMMIT;\s*$/);
  assert.match(migration, /DROP CONSTRAINT IF EXISTS "Transaction_vendorId_userId_fkey"/);
  assert.match(migration, /DROP CONSTRAINT IF EXISTS "Vendor_id_userId_key"/);
  assert.doesNotMatch(migration, /EXCEPTION WHEN duplicate_object/);
  assert.match(canonical, /UNIQUE\s*\(id,\s*"userId"\)/);
  assert.match(canonical, /FOREIGN KEY\s*\("vendorId",\s*"userId"\)\s*REFERENCES\s*"Vendor"\(id,\s*"userId"\)\s*ON DELETE SET NULL\s*\("vendorId"\)/);
  assert.match(migration, /ADD CONSTRAINT "Vendor_id_userId_key" UNIQUE \(id, "userId"\)/);
  assert.match(migration, /DROP CONSTRAINT IF EXISTS "Transaction_vendorId_fkey"/);
  assert.match(migration, /FOREIGN KEY\s*\("vendorId",\s*"userId"\)\s*REFERENCES\s*"Vendor"\(id,\s*"userId"\)\s*ON DELETE SET NULL\s*\("vendorId"\)/);
  assert.match(migration, /UPDATE "Transaction"[\s\S]*"vendorId"[\s\S]*"userId"/);
  assert.match(migration, /JOIN "User" AS owner ON owner\.id = vendor\."userId"/);
  assert.match(migration, /RAISE EXCEPTION 'Vendor rows reference missing users/);
  assert.ok(migration.indexOf('RAISE EXCEPTION \'Vendor rows reference missing users') < migration.indexOf('ADD CONSTRAINT "Vendor_userId_fkey"'));
});

test("transaction PATCH handles rejected route params inside its error boundary", async () => {
  const route = await read("../src/app/api/transactions/[id]/route.ts");
  assert.match(route, /try\s*\{\s*const \{ id \} = await params;/);
});

test("directorio de proveedores es user-scoped en lectura y escritura", async () => {
  const route = await read("../src/app/api/vendors/route.ts");
  assert.match(route, /WHERE "userId" = \$\{auth\.userId\}/);
  assert.match(route, /INSERT INTO "Vendor"/);
  assert.match(route, /\$\{auth\.userId\}/);
});
