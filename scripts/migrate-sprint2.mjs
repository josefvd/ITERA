import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required. Run this script with the production Neon connection string.");
}

const sql = neon(connectionString);

const statements = [
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "confidenceScore" REAL`,
  `CREATE INDEX IF NOT EXISTS "Invoice_shipmentRef_status_idx" ON "Invoice" ("shipmentRef", status)`,
  `CREATE INDEX IF NOT EXISTS "Invoice_scheduledFor_idx" ON "Invoice" ("scheduledFor") WHERE "scheduledFor" IS NOT NULL`,
];

for (const statement of statements) {
  await sql.query(statement);
  console.log(`✓ ${statement}`);
}

console.log("Sprint 2 invoice-payment migration completed.");
