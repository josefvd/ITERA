import { NextResponse } from "next/server";
import { useDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCardProvider } from "@/lib/payments";

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
      SELECT * FROM "PaymentMethod" WHERE id = ${id} AND "userId" = ${auth.userId}
    `;
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ error: "Método de pago no encontrado" }, { status: 404 });
    }

    // Notify provider (best-effort).
    try {
      const row = existing[0] as any;
      await getCardProvider().deleteMethod(row.providerRef);
    } catch {
      // ignore provider error; still remove locally
    }

    await sql`DELETE FROM "PaymentMethod" WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete payment method error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
