import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { createToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { name, email, password, company, phone } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }
    
    // Check existing user
    const existing = await sql`SELECT id FROM "User" WHERE email = ${email}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    
    const hashedPassword = await bcrypt.hash(password, 12)
    const id = crypto.randomUUID()
    
    await sql`
      INSERT INTO "User" (id, email, name, password, company, phone, "createdAt", "updatedAt")
      VALUES (${id}, ${email}, ${name}, ${hashedPassword}, ${company || null}, ${phone || null}, NOW(), NOW())
    `
    
    const token = await createToken({ userId: id, email })
    const cookieStore = await cookies()
    cookieStore.set('itera_token', token, { httpOnly: true, secure: false, path: '/', maxAge: 60 * 60 * 24 * 7 })
    
    return NextResponse.json({ user: { id, name, email, company } }, { status: 201 })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}