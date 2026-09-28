import { NextResponse } from "next/server";
import { useDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getBankProvider } from "@/lib/payments";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const sql = useDb();

    const existing = await sql`
      SELECT * FROM "BankAccount" WHERE id = ${id} AND "userId" = ${auth.userId}
    `;
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    try {
      const row = existing[0] as any;
      if (row.providerRef) await getBankProvider().unlinkAccount(row.providerRef);
    } catch {
      // ignore provider error
    }

    await sql`DELETE FROM "BankAccount" WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete bank account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
