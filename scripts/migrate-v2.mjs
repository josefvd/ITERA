import { Pool } from "@neondatabase/serverless";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createShipment = `
CREATE TABLE IF NOT EXISTS "Shipment" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP,
    urgency TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
)`;

const createApprovalRule = `
CREATE TABLE IF NOT EXISTS "ApprovalRule" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "maxAmount" REAL NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
)`;

const createTradeCredit = `
CREATE TABLE IF NOT EXISTS "TradeCredit" (
    id TEXT PRIMARY KEY,
    "shipmentId" TEXT NOT NULL REFERENCES "Shipment"(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    fee REAL NOT NULL DEFAULT 0,
    "feePercent" REAL NOT NULL DEFAULT 5,
    "termDays" INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP,
    "approvedAt" TIMESTAMP,
    "repaidAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
)`;

async function migrate() {
  try {
    await pool.query(createShipment);
    console.log("✓ Shipment table created");
  } catch (e) { console.error("✗ Shipment:", e.message?.substring(0, 100)); }
  
  try {
    await pool.query(createApprovalRule);
    console.log("✓ ApprovalRule table created");
  } catch (e) { console.error("✗ ApprovalRule:", e.message?.substring(0, 100)); }
  
  try {
    await pool.query(createTradeCredit);
    console.log("✓ TradeCredit table created");
  } catch (e) { console.error("✗ TradeCredit:", e.message?.substring(0, 100)); }
  
  await pool.end();
  console.log("\nMigración completada!");
}

migrate().catch(console.error);