import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { useDb } from "@/lib/db";
import { ensureInvoicePaymentSchema } from "@/lib/invoice-payment-schema";

const paymentMethods = new Set(["bank_account", "credit_card", "itera_credit"]);
const actions = new Set(["review", "pay", "schedule", "set_payment_method"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;
    const paymentMethod = body.paymentMethod as string | undefined;

    if (!actions.has(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (paymentMethod && !paymentMethods.has(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    await ensureInvoicePaymentSchema();
    const sql = useDb();
    const found: any = await sql`
      SELECT i.id, i.status
      FROM "Invoice" i
      JOIN "Transaction" t ON t.id = i."transactionId"
      WHERE i.id = ${id} AND t."userId" = ${auth.userId}
    `;
    if (!Array.isArray(found) || found.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (action === "review") {
      if (found[0].status !== "pending_review") {
        return NextResponse.json({ error: "Only invoices pending review can be approved" }, { status: 409 });
      }
      await sql`
        UPDATE "Invoice"
        SET status = 'pending', "reviewedAt" = NOW(), "reviewNote" = ${body.reviewNote || null}
        WHERE id = ${id}
      `;
    } else if (action === "pay") {
      if (found[0].status === "pending_review") {
        return NextResponse.json({ error: "Review the invoice before paying it" }, { status: 409 });
      }
      await sql`
        UPDATE "Invoice"
        SET status = 'paid', "paidAt" = NOW(), "scheduledFor" = NULL,
            "paymentMethod" = ${paymentMethod || null}
        WHERE id = ${id}
      `;
    } else if (action === "schedule") {
      const scheduledFor = body.scheduledFor as string | undefined;
      if (!scheduledFor || Number.isNaN(Date.parse(scheduledFor))) {
        return NextResponse.json({ error: "A valid scheduled payment date is required" }, { status: 400 });
      }
      if (found[0].status === "pending_review") {
        return NextResponse.json({ error: "Review the invoice before scheduling it" }, { status: 409 });
      }
      await sql`
        UPDATE "Invoice"
        SET status = 'scheduled', "scheduledFor" = ${scheduledFor},
            "paymentMethod" = ${paymentMethod || null}
        WHERE id = ${id}
      `;
    } else {
      await sql`UPDATE "Invoice" SET "paymentMethod" = ${paymentMethod || null} WHERE id = ${id}`;
    }

    const invoices: any = await sql`SELECT * FROM "Invoice" WHERE id = ${id}`;
    return NextResponse.json({ invoice: Array.isArray(invoices) ? invoices[0] : null });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
