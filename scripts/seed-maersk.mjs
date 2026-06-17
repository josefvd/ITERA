import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  const users = await sql`SELECT id, email, name FROM "User" LIMIT 1`;
  if (!users.length) {
    console.error('No users found. Create a user first via the app.');
    process.exit(1);
  }
  const user = users[0];
  console.log(`Seeding for user: ${user.email} (${user.id})`);

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 15);

  const reference = 'MAERSK-2026-001';
  const shipmentId = crypto.randomUUID();

  const invoices = [
    { type: 'freight', label: 'Flete', vendor: 'Maersk Line', amount: 7200, invNum: 'MAEU-2026-001-FL' },
    { type: 'taxes', label: 'Impuestos', vendor: 'Dirección de Aduanas', amount: 2100, invNum: 'MAEU-2026-001-TX' },
    { type: 'storage', label: 'Almacenaje', vendor: 'Terminal de Puerto', amount: 1800, invNum: 'MAEU-2026-001-ST' },
    { type: 'transport', label: 'Transporte', vendor: 'Transportes Centroamérica', amount: 1350, invNum: 'MAEU-2026-001-TP' },
  ];

  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);

  await sql`
    INSERT INTO "Shipment" (id, "userId", reference, status, "totalAmount", "dueDate", urgency, "createdAt", "updatedAt")
    VALUES (${shipmentId}, ${user.id}, ${reference}, 'pending', ${totalAmount}, ${dueDate.toISOString()}, 'normal', ${now.toISOString()}, ${now.toISOString()})
  `;
  console.log(`✅ Shipment created: ${reference} ($${totalAmount})`);

  for (const inv of invoices) {
    const txnId = crypto.randomUUID();
    await sql`
      INSERT INTO "Transaction" (id, "userId", "vendorName", amount, currency, status, "paymentMethod", description, "createdAt", "updatedAt", "invoiceRef")
      VALUES (${txnId}, ${user.id}, ${inv.vendor}, ${inv.amount}, 'USD', 'pending', null, ${`${inv.label} — Embarque ${reference}`}, ${now.toISOString()}, ${now.toISOString()}, ${reference})
    `;
    const invoiceId = crypto.randomUUID();
    await sql`
      INSERT INTO "Invoice" (id, "transactionId", "invoiceNumber", "vendorName", amount, "dueDate", status, "issuedAt", "createdAt", "shipmentRef", "invoiceType")
      VALUES (${invoiceId}, ${txnId}, ${inv.invNum}, ${inv.vendor}, ${inv.amount}, ${dueDate.toISOString()}, 'pending', ${now.toISOString()}, ${now.toISOString()}, ${reference}, ${inv.type})
    `;
    console.log(`  ✅ ${inv.label}: $${inv.amount} — ${inv.invNum}`);
  }

  console.log(`\n🎉 Done! Embarque ${reference} con ${invoices.length} facturas. Total: $${totalAmount}`);
}

seed().catch(err => { console.error(err); process.exit(1); });
