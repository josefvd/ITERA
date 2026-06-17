import { NextResponse } from 'next/server'
import { useDb } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

const INVOICES = [
  {
    type: 'freight',
    label: 'Flete',
    vendorName: 'Maersk Line',
    amount: 7200,
    invoiceNumber: 'MAEU-2026-001-FL',
  },
  {
    type: 'taxes',
    label: 'Impuestos',
    vendorName: 'Dirección de Aduanas',
    amount: 2100,
    invoiceNumber: 'MAEU-2026-001-TX',
  },
  {
    type: 'storage',
    label: 'Almacenaje',
    vendorName: 'Terminal de Puerto',
    amount: 1800,
    invoiceNumber: 'MAEU-2026-001-ST',
  },
  {
    type: 'transport',
    label: 'Transporte',
    vendorName: 'Transportes Centroamérica',
    amount: 1350,
    invoiceNumber: 'MAEU-2026-001-TP',
  },
]

export async function POST() {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = useDb()
    const now = new Date()
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + 15) // vence en 15 días

    // 1. Crear shipment Maersk
    const shipmentId = crypto.randomUUID()
    const reference = 'MAERSK-2026-001'
    const totalAmount = INVOICES.reduce((sum, inv) => sum + inv.amount, 0)

    await sql`
      INSERT INTO "Shipment" (id, "userId", reference, status, "totalAmount", "dueDate", urgency, "createdAt", "updatedAt")
      VALUES (${shipmentId}, ${auth.userId}, ${reference}, 'pending', ${totalAmount}, ${dueDate.toISOString()}, 'normal', ${now.toISOString()}, ${now.toISOString()})
    `

    // 2. Crear transacciones + facturas
    const created: any[] = []
    for (const inv of INVOICES) {
      const txnId = crypto.randomUUID()
      // Transaction
      await sql`
        INSERT INTO "Transaction" (id, "userId", "vendorName", amount, currency, status, "paymentMethod", description, "createdAt", "updatedAt", "invoiceRef")
        VALUES (${txnId}, ${auth.userId}, ${inv.vendorName}, ${inv.amount}, 'USD', 'pending', null, ${`${inv.label} — Embarque ${reference}`}, ${now.toISOString()}, ${now.toISOString()}, ${reference})
      `
      // Invoice linked to transaction
      const invoiceId = crypto.randomUUID()
      await sql`
        INSERT INTO "Invoice" (id, "transactionId", "invoiceNumber", "vendorName", amount, "dueDate", status, "issuedAt", "createdAt", "shipmentRef", "invoiceType")
        VALUES (${invoiceId}, ${txnId}, ${inv.invoiceNumber}, ${inv.vendorName}, ${inv.amount}, ${dueDate.toISOString()}, 'pending', ${now.toISOString()}, ${now.toISOString()}, ${reference}, ${inv.type})
      `
      created.push({ invoiceNumber: inv.invoiceNumber, type: inv.type, vendorName: inv.vendorName, amount: inv.amount })
    }

    return NextResponse.json({
      ok: true,
      message: `Embarque ${reference} creado con ${INVOICES.length} facturas`,
      shipment: { id: shipmentId, reference, totalAmount },
      invoices: created,
    }, { status: 201 })
  } catch (error) {
    console.error('Seed Maersk error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
