import { NextResponse } from 'next/server'
import { useDb } from '@/lib/db'
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
    const sql = useDb()

    const shipments: any = await sql`
      SELECT * FROM "Shipment" WHERE id = ${id} AND "userId" = ${auth.userId}
    `
    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const shipment = shipments[0]

    // Pay all invoices for this shipment
    await sql`
      UPDATE "Invoice" SET status = 'paid', "paidAt" = NOW()
      WHERE "shipmentRef" = ${shipment.reference} AND status != 'paid'
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