-- ITERA PostgreSQL schema: fresh-database baseline only; not a reconciliation migration.
-- Existing Neon databases must use the ordered scripts/migrations/*.sql release path.

CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "BankAccount" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "accountType" TEXT NOT NULL DEFAULT 'checking',
    "bankName" TEXT,
    "accountNumber" TEXT,
    "routingNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    balance REAL NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Vendor" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "billingEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "Vendor_id_userId_key" UNIQUE (id, "userId")
);
CREATE INDEX IF NOT EXISTS "Vendor_userId_name_idx" ON "Vendor"("userId", name);

CREATE TABLE IF NOT EXISTS "Transaction" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "vendorEmail" TEXT,
    "serviceType" TEXT,
    "referenceType" TEXT,
    "referenceNumber" TEXT,
    "relatedReference" TEXT,
    "commercialValue" NUMERIC(12,2),
    "scheduledFor" TIMESTAMP,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    description TEXT,
    "invoiceRef" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Clear only the optional vendor link; preserve the transaction's required tenant key.
    CONSTRAINT "Transaction_vendorId_userId_fkey"
        FOREIGN KEY ("vendorId", "userId")
        REFERENCES "Vendor"(id, "userId")
        ON DELETE SET NULL ("vendorId")
);
CREATE INDEX IF NOT EXISTS "Transaction_vendorId_userId_idx" ON "Transaction"("vendorId", "userId");

CREATE TABLE IF NOT EXISTS "Invoice" (
    id TEXT PRIMARY KEY,
    "transactionId" TEXT NOT NULL UNIQUE REFERENCES "Transaction"(id) ON DELETE CASCADE,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL,
    "dueDate" TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    "issuedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "paidAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);