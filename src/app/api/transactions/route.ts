import { NextResponse } from "next/server";
import { dbGet, dbQuery } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = dbQuery(
      "SELECT * FROM Transaction WHERE userId = ? ORDER BY createdAt DESC LIMIT 50",
      [auth.userId]
    );

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vendorName, vendorEmail, amount, description, paymentMethod } =
      await request.json();

    if (!vendorName || !amount) {
      return NextResponse.json(
        { error: "Vendor name and amount are required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    dbQuery(
      `INSERT INTO Transaction (id, userId, vendorName, vendorEmail, amount, currency, status, paymentMethod, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'USD', 'pending', ?, ?, datetime('now'), datetime('now'))`,
      [
        id,
        auth.userId,
        vendorName,
        vendorEmail || null,
        parseFloat(amount),
        paymentMethod || null,
        description || null,
      ]
    );

    const transaction = dbGet(
      "SELECT * FROM Transaction WHERE id = ?",
      [id]
    );

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}