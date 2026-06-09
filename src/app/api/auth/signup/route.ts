import { NextResponse } from "next/server";
import { dbGet, dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/utils";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, company, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = dbGet<{ id: string }>(
      "SELECT id FROM User WHERE email = ?",
      [email]
    );
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();

    dbQuery(
      `INSERT INTO User (id, email, name, password, company, phone, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, email, name, hashedPassword, company || null, phone || null]
    );

    const token = await createToken({ userId: id, email });

    const response = NextResponse.json(
      {
        user: {
          id,
          name,
          email,
          company,
          phone,
        },
      },
      { status: 201 }
    );

    response.cookies.set("itera_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}