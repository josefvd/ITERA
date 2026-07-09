import { useDb } from "@/lib/db";

let schemaPromise: Promise<void> | null = null;

/**
 * The project has no deployment-time migration runner. This idempotent bridge
 * keeps the invoice-payment release compatible with existing Neon databases.
 * The same SQL is available in scripts/migrate-sprint2.mjs for explicit runs.
 */
export function ensureInvoicePaymentSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = useDb();
      const statements = [
        `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT`,
        `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP`,
        `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP`,
        `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT`,
        `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'`,
        `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "confidenceScore" REAL`,
        `CREATE INDEX IF NOT EXISTS "Invoice_shipmentRef_status_idx" ON "Invoice" ("shipmentRef", status)`,
      ];
      for (const statement of statements) await sql.query(statement);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}
