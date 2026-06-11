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
    const rules: any = await sql`
      SELECT * FROM "ApprovalRule" WHERE "userId" = ${auth.userId} ORDER BY "createdAt" DESC
    `

    return NextResponse.json({ rules: Array.isArray(rules) ? rules : [] })
  } catch (error) {
    console.error('Get approval rules error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { maxAmount, approverEmail, isActive } = await request.json()
    if (!maxAmount || !approverEmail) {
      return NextResponse.json({ error: 'Max amount and approver email are required' }, { status: 400 })
    }

    const sql = useDb()
    const id = crypto.randomUUID()

    await sql`
      INSERT INTO "ApprovalRule" (id, "userId", "maxAmount", "approverEmail", "isActive", "createdAt")
      VALUES (${id}, ${auth.userId}, ${parseFloat(maxAmount)}, ${approverEmail}, ${isActive !== false}, NOW())
    `

    const result: any = await sql`SELECT * FROM "ApprovalRule" WHERE id = ${id}`
    const rule = Array.isArray(result) && result.length > 0 ? result[0] : null

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error('Create approval rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}