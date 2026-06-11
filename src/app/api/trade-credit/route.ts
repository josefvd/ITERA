import { NextResponse } from 'next/server'
import { useDb } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = useDb()
    const credits: any = await sql`
      SELECT tc.*, s.reference as "shipmentRef"
      FROM "TradeCredit" tc
      LEFT JOIN "Shipment" s ON s.id = tc."shipmentId"
      WHERE tc."userId" = ${auth.userId}
      ORDER BY tc."createdAt" DESC
      LIMIT 50
    `

    return NextResponse.json({ tradeCredits: Array.isArray(credits) ? credits : [] })
  } catch (error) {
    console.error('Get trade credits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shipmentId, amount, termDays, feePercent } = await request.json()
    if (!shipmentId || !amount) {
      return NextResponse.json({ error: 'Shipment ID and amount are required' }, { status: 400 })
    }

    const sql = useDb()

    // Verify shipment exists and belongs to user
    const shipments: any = await sql`
      SELECT * FROM "Shipment" WHERE id = ${shipmentId} AND "userId" = ${auth.userId}
    `
    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const shipment = shipments[0]
    const id = crypto.randomUUID()
    const pct = feePercent || 2.5
    const days = termDays || 30
    const fee = parseFloat(amount) * (pct / 100)

    // Calculate due date (30 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)

    await sql`
      INSERT INTO "TradeCredit" (id, "shipmentId", "userId", amount, fee, "feePercent", "termDays", status, "dueDate", "createdAt")
      VALUES (${id}, ${shipmentId}, ${auth.userId}, ${parseFloat(amount)}, ${fee}, ${pct}, ${days}, 'approved', ${dueDate.toISOString()}, NOW())
    `

    // Update shipment status to financed
    await sql`
      UPDATE "Shipment" SET status = 'financed', "updatedAt" = NOW() WHERE id = ${shipmentId}
    `

    // Update associated invoices to financed
    await sql`
      UPDATE "Invoice" SET status = 'paid', "paidAt" = NOW()
      WHERE "shipmentRef" = ${shipment.reference} AND status != 'paid'
    `

    const result: any = await sql`SELECT * FROM "TradeCredit" WHERE id = ${id}`
    const tradeCredit = Array.isArray(result) && result.length > 0 ? result[0] : null

    return NextResponse.json({ tradeCredit }, { status: 201 })
  } catch (error) {
    console.error('Create trade credit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}