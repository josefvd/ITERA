import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { useDb } from '@/lib/db'
import { createToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const sql = useDb()
    const users: any = await sql`
      SELECT id, email, name, password, company, phone
      FROM "User" WHERE email = ${email}
    `
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = users[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createToken({ userId: user.id, email: user.email })
    const cookieStore = await cookies()
    cookieStore.set('itera_token', token, { httpOnly: true, secure: false, path: '/', maxAge: 60 * 60 * 24 * 7 })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
      },
    })
  } catch (err) {
    console.error('Signin error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}