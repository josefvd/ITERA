import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { useDb } from "@/lib/db";
import { ensureInvoicePaymentSchema } from "@/lib/invoice-payment-schema";

const invoiceStatuses = new Set(["pending_review", "pending", "scheduled", "paid"]);

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = new URL(request.url).searchParams.get("status");
    if (status && !invoiceStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid invoice status" }, { status: 400 });
    }

    await ensureInvoicePaymentSchema();
    const sql = useDb();
    const invoices: any = status
      ? await sql`
          SELECT i.*, t."vendorName" AS "transactionVendorName"
          FROM "Invoice" i
          JOIN "Transaction" t ON t.id = i."transactionId"
          WHERE t."userId" = ${auth.userId} AND i.status = ${status}
          ORDER BY i."scheduledFor" NULLS LAST, i."dueDate" NULLS LAST, i."issuedAt" DESC
        `
      : await sql`
          SELECT i.*, t."vendorName" AS "transactionVendorName"
          FROM "Invoice" i
          JOIN "Transaction" t ON t.id = i."transactionId"
          WHERE t."userId" = ${auth.userId}
          ORDER BY i."scheduledFor" NULLS LAST, i."dueDate" NULLS LAST, i."issuedAt" DESC
        `;

    return NextResponse.json({ invoices: Array.isArray(invoices) ? invoices : [] });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
