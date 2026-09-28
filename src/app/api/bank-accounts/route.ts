import { NextResponse } from "next/server";
import { useDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getBankProvider } from "@/lib/payments";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sql = useDb();
    const accounts = await sql`
      SELECT * FROM "BankAccount" WHERE "userId" = ${auth.userId}
      ORDER BY "createdAt" DESC
    `;
    return NextResponse.json({ accounts: Array.isArray(accounts) ? accounts : [] });
  } catch (error) {
    console.error("Get bank accounts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bankName, accountNumber, routingNumber, accountHolder, accountType } =
      await request.json();

    const provider = getBankProvider();
    const linked = await provider.linkAccount({
      bankName,
      accountNumber,
      routingNumber,
      accountHolder,
      accountType,
    });

    const sql = useDb();
    const id = crypto.randomUUID();

    await sql`
      INSERT INTO "BankAccount" (id, "userId", "accountType", "bankName", "accountNumber", "routingNumber", "isVerified", provider, "providerRef", "accountHolder", "createdAt", "updatedAt")
      VALUES (${id}, ${auth.userId}, ${accountType || "checking"}, ${linked.bankName}, ${`****${linked.accountNumberLast4}`}, ${routingNumber || null}, ${linked.verified}, ${provider.name}, ${linked.providerRef}, ${accountHolder || null}, NOW(), NOW())
    `;

    const result = await sql`SELECT * FROM "BankAccount" WHERE id = ${id}`;
    const account = Array.isArray(result) && result.length > 0 ? result[0] : null;

    return NextResponse.json({ account }, { status: 201 });
  } catch (error: any) {
    console.error("Link bank account error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 400 });
  }
}
