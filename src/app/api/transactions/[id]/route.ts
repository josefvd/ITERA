import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { useDb as getDb } from "@/lib/db";
import { isAllowedTransactionStatus } from "@/lib/transaction-status";

type TransactionRecord = {
  id: string;
  userId: string;
  vendorName: string;
  vendorEmail: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!isAllowedTransactionStatus(status)) {
      return NextResponse.json(
        { error: "Estado de transacción inválido" },
        { status: 400 }
      );
    }

    const sql = getDb();
    const existing = (await sql`
      SELECT * FROM "Transaction" WHERE id = ${id} AND "userId" = ${auth.userId}
    `) as TransactionRecord[];

    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    const updated = (await sql`
      UPDATE "Transaction"
      SET status = ${status}, "updatedAt" = NOW()
      WHERE id = ${id} AND "userId" = ${auth.userId}
      RETURNING *
    `) as TransactionRecord[];

    const transaction =
      Array.isArray(updated) && updated.length > 0 ? updated[0] : null;

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
