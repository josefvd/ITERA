-- Additive transaction form/provider directory migration (PostgreSQL 15+).
BEGIN;
CREATE TABLE IF NOT EXISTS "Vendor" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "billingEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Vendor_userId_name_idx" ON "Vendor" ("userId", name);
ALTER TABLE "Vendor" DROP CONSTRAINT IF EXISTS "Vendor_userId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_vendorId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_vendorId_userId_fkey";
ALTER TABLE "Vendor" DROP CONSTRAINT IF EXISTS "Vendor_id_userId_key";
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_id_userId_key" UNIQUE (id, "userId");
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "serviceType" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "referenceType" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "relatedReference" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "commercialValue" REAL;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Transaction_vendorId_userId_idx" ON "Transaction" ("vendorId", "userId");
-- Round legacy floating-point values to cents and store future amounts exactly.
ALTER TABLE "Transaction" ALTER COLUMN amount TYPE NUMERIC(12,2) USING ROUND(amount::numeric, 2);
ALTER TABLE "Transaction" ALTER COLUMN "commercialValue" TYPE NUMERIC(12,2) USING ROUND("commercialValue"::numeric, 2);
-- Detach missing or cross-user legacy references rather than carrying a tenant violation forward.
UPDATE "Transaction" AS txn
SET "vendorId" = NULL
WHERE txn."vendorId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Vendor" AS vendor
    JOIN "User" AS owner ON owner.id = vendor."userId"
    WHERE vendor.id = txn."vendorId" AND vendor."userId" = txn."userId"
  );
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM "Vendor" AS vendor
    WHERE NOT EXISTS (SELECT 1 FROM "User" AS owner WHERE owner.id = vendor."userId")
  ) THEN
    RAISE EXCEPTION 'Vendor rows reference missing users; resolve them before applying the transaction directory migration';
  END IF;
END $$;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
-- Clear only the vendor link; the User→Transaction cascade still deletes a user's records.
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vendorId_userId_fkey"
  FOREIGN KEY ("vendorId", "userId")
  REFERENCES "Vendor"(id, "userId")
  ON DELETE SET NULL ("vendorId");
COMMIT;
