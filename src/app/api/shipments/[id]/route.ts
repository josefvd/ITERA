import { NextResponse } from 'next/server'
import { useDb } from '@/lib/db'
import { ensureInvoicePaymentSchema } from '@/lib/invoice-payment-schema'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const sql = useDb()

    const shipments: any = await sql`
      SELECT * FROM "Shipment" WHERE id = ${id} AND "userId" = ${auth.userId}
    `
    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const shipment = shipments[0]

    const invoices: any = await sql`
      SELECT * FROM "Invoice" WHERE "shipmentRef" = ${shipment.reference} ORDER BY "issuedAt" DESC
    `

    return NextResponse.json({ shipment, invoices: Array.isArray(invoices) ? invoices : [] })
  } catch (error) {
    console.error('Get shipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await ensureInvoicePaymentSchema()
    const sql = useDb()

    const shipments: any = await sql`
      SELECT * FROM "Shipment" WHERE id = ${id} AND "userId" = ${auth.userId}
    `
    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const shipment = shipments[0]
    const body = await request.json().catch(() => ({}))
    const action = body.action === 'schedule' ? 'schedule' : 'pay'
    const paymentMethod = body.paymentMethod || null
    const invoiceIds = Array.isArray(body.invoiceIds) ? body.invoiceIds.filter((value: unknown) => typeof value === 'string') : []
    const scheduledFor = body.scheduledFor

    if (paymentMethod && !['bank_account', 'credit_card', 'itera_credit'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }
    if (action === 'schedule' && (!scheduledFor || Number.isNaN(Date.parse(scheduledFor)))) {
      return NextResponse.json({ error: 'A valid scheduled payment date is required' }, { status: 400 })
    }

    const outstanding: any = await sql`
      SELECT id, status FROM "Invoice"
      WHERE "shipmentRef" = ${shipment.reference} AND status NOT IN ('paid', 'pending_review')
    `
    const candidates = Array.isArray(outstanding) ? outstanding : []
    const selected = invoiceIds.length > 0
      ? candidates.filter((invoice: { id: string }) => invoiceIds.includes(invoice.id))
      : candidates

    if (selected.length === 0) {
      return NextResponse.json({ error: 'No reviewed invoices are available for this action' }, { status: 409 })
    }

    for (const invoice of selected) {
      if (action === 'schedule') {
        await sql`
          UPDATE "Invoice"
          SET status = 'scheduled', "scheduledFor" = ${scheduledFor}, "paymentMethod" = ${paymentMethod}
          WHERE id = ${invoice.id}
        `
      } else {
        await sql`
          UPDATE "Invoice"
          SET status = 'paid', "paidAt" = NOW(), "scheduledFor" = NULL, "paymentMethod" = ${paymentMethod}
          WHERE id = ${invoice.id}
        `
      }
    }

    const remaining: any = await sql`
      SELECT COUNT(*)::int AS count FROM "Invoice"
      WHERE "shipmentRef" = ${shipment.reference} AND status != 'paid'
    `
    const hasRemaining = Array.isArray(remaining) && Number(remaining[0]?.count) > 0
    await sql`
      UPDATE "Shipment" SET status = ${hasRemaining ? 'pending' : 'paid'}, "updatedAt" = NOW() WHERE id = ${id}
    `

    if (action === 'pay' && !hasRemaining) {
      await sql`
        UPDATE "Transaction" SET status = 'completed', "updatedAt" = NOW()
        WHERE "invoiceRef" = ${shipment.reference} AND status = 'pending'
      `
    }

    const updated: any = await sql`SELECT * FROM "Shipment" WHERE id = ${id}`
    const updatedShipment = Array.isArray(updated) && updated.length > 0 ? updated[0] : null

    const invoices: any = await sql`
      SELECT * FROM "Invoice" WHERE "shipmentRef" = ${shipment.reference} ORDER BY "issuedAt" DESC
    `

    return NextResponse.json({ shipment: updatedShipment, invoices: Array.isArray(invoices) ? invoices : [] })
  } catch (error) {
    console.error('Pay shipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}