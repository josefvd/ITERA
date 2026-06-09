const { neon } = require('@neondatabase/serverless')
const path = require('path')
const cwd = process.cwd()
require('dotenv').config({ path: path.join(cwd, '.env') })

async function main() {
  const sql = neon(process.env.DATABASE_URL)
  
  // Run User table creation
  try {
    await sql`CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`
    console.log('✓ Created User table')
  } catch(e) {
    console.error('✗ User table error:', e.message)
  }

  // Run BankAccount table creation
  try {
    await sql`CREATE TABLE IF NOT EXISTS "BankAccount" (
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
    )`
    console.log('✓ Created BankAccount table')
  } catch(e) {
    console.error('✗ BankAccount error:', e.message)
  }

  // Run Transaction table creation
  try {
    await sql`CREATE TABLE IF NOT EXISTS "Transaction" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "vendorName" TEXT NOT NULL,
      "vendorEmail" TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      "paymentMethod" TEXT,
      description TEXT,
      "invoiceRef" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`
    console.log('✓ Created Transaction table')
  } catch(e) {
    console.error('✗ Transaction error:', e.message)
  }

  // Run Invoice table creation
  try {
    await sql`CREATE TABLE IF NOT EXISTS "Invoice" (
      id TEXT PRIMARY KEY,
      "transactionId" TEXT NOT NULL UNIQUE REFERENCES "Transaction"(id) ON DELETE CASCADE,
      "invoiceNumber" TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      "dueDate" TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending',
      "issuedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "paidAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`
    console.log('✓ Created Invoice table')
  } catch(e) {
    console.error('✗ Invoice error:', e.message)
  }

  // Verify
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  console.log('Tables in database:', tables.map(t => t.table_name))
}

main().catch(console.error)