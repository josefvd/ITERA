import { NextResponse } from 'next/server'
import { useDb } from '@/lib/db'
import { ensureInvoicePaymentSchema } from '@/lib/invoice-payment-schema'
import { getAuthUser } from '@/lib/auth'
import { getCardProvider } from '@/lib/payments'

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

    const body = await request.json().catch(() => ({}))
    const action = body.action || 'pay'
    const paymentMethodId = body.paymentMethodId || null
    const paymentMethod = body.paymentMethod || null
    const invoiceIds = Array.isArray(body.invoiceIds) ? body.invoiceIds.filter((value: unknown) => typeof value === 'string') : []
    const scheduledFor = body.scheduledFor

    const shipments: any = await sql`
      SELECT * FROM "Shipment" WHERE id = ${id} AND "userId" = ${auth.userId}
    `
    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const shipment = shipments[0]

    // ===== ACTION: SCHEDULE (remote model — approve/schedule obligations) =====
    if (action === 'schedule') {
      if (paymentMethod && !['bank_account', 'credit_card', 'itera_credit'].includes(paymentMethod)) {
        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
      }
      if (!scheduledFor || Number.isNaN(Date.parse(scheduledFor))) {
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
        await sql`
          UPDATE "Invoice"
          SET status = 'scheduled', "scheduledFor" = ${scheduledFor}, "paymentMethod" = ${paymentMethod}
          WHERE id = ${invoice.id}
        `
      }
    }

    // ===== ACTION: PAY (batch immediate pay with card gateway) =====
    if (action === 'pay' || action === 'pay_all' || !action) {
      const pendingInvoices: any = await sql`
        SELECT * FROM "Invoice" WHERE "shipmentRef" = ${shipment.reference} AND status NOT IN ('paid', 'cancelled')
      `
      const targets = (Array.isArray(pendingInvoices) ? pendingInvoices : [])
      const totalPending = targets.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)

      if (totalPending > 0) {
        let paidWith = 'manual'
        // If a payment method was provided, charge the total first (mock gateway).
        if (paymentMethodId) {
          const methods: any = await sql`
            SELECT * FROM "PaymentMethod" WHERE id = ${paymentMethodId} AND "userId" = ${auth.userId}
          `
          const method = Array.isArray(methods) && methods.length > 0 ? methods[0] : null
          if (!method) {
            return NextResponse.json({ error: 'Método de pago no encontrado' }, { status: 404 })
          }
          const charge = await getCardProvider().charge({
            providerRef: method.providerRef,
            amount: totalPending,
            currency: 'USD',
            description: `Pago de embarque ${shipment.reference}`,
          })
          if (charge.status === 'failed') {
            return NextResponse.json({ error: charge.message || 'Cargo rechazado' }, { status: 402 })
          }
          paidWith = `card ****${method.cardLast4 || ''}`
          // Record the payment as a completed transaction
          const txnId = crypto.randomUUID()
          await sql`
            INSERT INTO "Transaction" (id, "userId", "vendorName", amount, currency, status, "paymentMethod", description, "createdAt", "updatedAt", "invoiceRef")
            VALUES (${txnId}, ${auth.userId}, ${`Pago embarque ${shipment.reference}`}, ${totalPending}, 'USD', 'completed', 'card', ${`Pago con ${method.cardBrand || 'tarjeta'} ****${method.cardLast4 || ''}`}, NOW(), NOW(), ${shipment.reference})
          `
        }

        // Pay all invoices for this shipment
        await sql`
          UPDATE "Invoice" SET status = 'paid', "paidAt" = NOW(), "paymentMethod" = COALESCE("paymentMethod", ${paidWith})
          WHERE "shipmentRef" = ${shipment.reference} AND status NOT IN ('paid', 'cancelled')
        `

        // Update shipment status to paid
        await sql`
          UPDATE "Shipment" SET status = 'paid', "updatedAt" = NOW() WHERE id = ${id}
        `

        // Also update any associated transactions
        await sql`
          UPDATE "Transaction" SET status = 'completed', "updatedAt" = NOW()
          WHERE "invoiceRef" = ${shipment.reference} AND status = 'pending'
        `
      }
    }

    const updated: any = await sql`SELECT * FROM "Shipment" WHERE id = ${id}`
    const updatedShipment = Array.isArray(updated) && updated.length > 0 ? updated[0] : null

    const updatedInvoices: any = await sql`
      SELECT * FROM "Invoice" WHERE "shipmentRef" = ${shipment.reference} ORDER BY "issuedAt" DESC
    `

    return NextResponse.json({ shipment: updatedShipment, invoices: Array.isArray(updatedInvoices) ? updatedInvoices : [] })
  } catch (error) {
    console.error('Pay shipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
