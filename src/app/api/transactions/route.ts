import { NextResponse } from 'next/server'
import { useDb as getDb } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

type TransactionRecord = {
  id: string
  userId: string
  vendorName: string
  vendorEmail: string | null
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export async function GET() {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = getDb()
    const transactions = await sql`
      SELECT * FROM "Transaction" WHERE "userId" = ${auth.userId}
      ORDER BY "createdAt" DESC LIMIT 50
    ` as TransactionRecord[]

    return NextResponse.json({ transactions: Array.isArray(transactions) ? transactions : [] })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vendorName, vendorEmail, amount, description, paymentMethod } = await request.json()
    if (!vendorName || !amount) {
      return NextResponse.json({ error: 'Proveedor y monto son obligatorios' }, { status: 400 })
    }

    const sql = getDb()
    const id = crypto.randomUUID()

    await sql`
      INSERT INTO "Transaction" (id, "userId", "vendorName", "vendorEmail", amount, currency, status, "paymentMethod", description, "createdAt", "updatedAt")
      VALUES (${id}, ${auth.userId}, ${vendorName}, ${vendorEmail || null}, ${parseFloat(amount)}, 'USD', 'pending', ${paymentMethod || null}, ${description || null}, NOW(), NOW())
    `

    const result = await sql`SELECT * FROM "Transaction" WHERE id = ${id}` as TransactionRecord[]
    const transaction = Array.isArray(result) && result.length > 0 ? result[0] : null

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}