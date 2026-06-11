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

    const credits: any = await sql`
      SELECT tc.*, s.reference as "shipmentRef"
      FROM "TradeCredit" tc
      LEFT JOIN "Shipment" s ON s.id = tc."shipmentId"
      WHERE tc.id = ${id} AND tc."userId" = ${auth.userId}
    `

    if (!Array.isArray(credits) || credits.length === 0) {
      return NextResponse.json({ error: 'Trade credit not found' }, { status: 404 })
    }

    return NextResponse.json({ tradeCredit: credits[0] })
  } catch (error) {
    console.error('Get trade credit error:', error)
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
    const { action } = await request.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 })
    }

    const sql = useDb()

    const credits: any = await sql`
      SELECT * FROM "TradeCredit" WHERE id = ${id} AND "userId" = ${auth.userId}
    `
    if (!Array.isArray(credits) || credits.length === 0) {
      return NextResponse.json({ error: 'Trade credit not found' }, { status: 404 })
    }

    if (action === 'approve') {
      await sql`
        UPDATE "TradeCredit" SET status = 'approved', "approvedAt" = NOW() WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE "TradeCredit" SET status = 'rejected' WHERE id = ${id}
      `
    }

    const result: any = await sql`SELECT * FROM "TradeCredit" WHERE id = ${id}`
    const tradeCredit = Array.isArray(result) && result.length > 0 ? result[0] : null

    return NextResponse.json({ tradeCredit })
  } catch (error) {
    console.error('Update trade credit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}