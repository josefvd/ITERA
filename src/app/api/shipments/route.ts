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
    const shipments: any = await sql`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM "Invoice" WHERE "shipmentRef" = s.reference) as "invoiceCount",
        (SELECT COALESCE(ARRAY_AGG(DISTINCT i."vendorName"), '{}') FROM "Invoice" i WHERE i."shipmentRef" = s.reference) as vendors
      FROM "Shipment" s
      WHERE s."userId" = ${auth.userId}
      ORDER BY s."createdAt" DESC
      LIMIT 50
    `

    return NextResponse.json({ shipments: Array.isArray(shipments) ? shipments : [] })
  } catch (error) {
    console.error('Get shipments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reference, totalAmount, dueDate, urgency } = await request.json()
    if (!reference || !totalAmount) {
      return NextResponse.json({ error: 'Reference and total amount are required' }, { status: 400 })
    }

    const sql = useDb()
    const id = crypto.randomUUID()

    await sql`
      INSERT INTO "Shipment" (id, "userId", reference, status, "totalAmount", "dueDate", urgency, "createdAt", "updatedAt")
      VALUES (${id}, ${auth.userId}, ${reference}, 'pending', ${parseFloat(totalAmount)}, ${dueDate || null}, ${urgency || 'normal'}, NOW(), NOW())
    `

    const result: any = await sql`SELECT * FROM "Shipment" WHERE id = ${id}`
    const shipment = Array.isArray(result) && result.length > 0 ? result[0] : null

    return NextResponse.json({ shipment }, { status: 201 })
  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}