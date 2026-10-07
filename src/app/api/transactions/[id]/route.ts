import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { useDb as getDb } from "@/lib/db";
import { canTransitionTransactionStatus } from "@/lib/transaction-status";
import { createTransactionPatchHandler } from "@/lib/transaction-handlers";

type StatusRecord = { status: string; scheduledFor: string | Date | null };
type TransactionRecord = Record<string, unknown>;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await createTransactionPatchHandler({
      getAuth: getAuthUser,
      async update({ userId, id: transactionId, nextStatus, scheduledFor }) {
        const sql = getDb();
        const [existing] = await sql`SELECT status, "scheduledFor" FROM "Transaction" WHERE id = ${transactionId} AND "userId" = ${userId}` as StatusRecord[];
        if (!existing) return { kind: "not-found" };
        if (!canTransitionTransactionStatus(existing.status, nextStatus, existing.scheduledFor)) return { kind: "invalid-transition" };
        const [updated] = await sql`
          UPDATE "Transaction"
          SET status = ${nextStatus},
              "scheduledFor" = CASE WHEN ${nextStatus} = 'scheduled' THEN ${scheduledFor} ELSE "scheduledFor" END,
              "updatedAt" = NOW()
          WHERE id = ${transactionId} AND "userId" = ${userId} AND status = ${existing.status}
          RETURNING id, "userId", "vendorId", "vendorName", "vendorEmail", amount, currency, status, "paymentMethod", description, "serviceType", "referenceType", "referenceNumber", "relatedReference", "commercialValue", "scheduledFor", "createdAt", "updatedAt"
        ` as TransactionRecord[];
        return updated ? { kind: "updated", transaction: updated } : { kind: "conflict" };
      },
    })(request, id);
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
