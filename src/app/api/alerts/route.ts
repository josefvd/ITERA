import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { useDb } from "@/lib/db";
import { ensureInvoicePaymentSchema } from "@/lib/invoice-payment-schema";

// Expiry alerts: invoices due within N days (default 7) or already overdue.
// Also surfaces scheduled payments that fall due today or earlier.
const DEFAULT_WINDOW_DAYS = 7;

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const windowDays = Number(
      new URL(request.url).searchParams.get("days") || DEFAULT_WINDOW_DAYS
    );

    await ensureInvoicePaymentSchema();
    const sql = useDb();

    const invoices: any = await sql`
      SELECT i.*, t."vendorName" AS "transactionVendorName"
      FROM "Invoice" i
      JOIN "Transaction" t ON t.id = i."transactionId"
      WHERE t."userId" = ${auth.userId}
        AND i.status IN ('pending_review', 'pending', 'scheduled')
        AND i."dueDate" IS NOT NULL
      ORDER BY i."dueDate" ASC
    `;

    const now = Date.now();
    const dayMs = 86400000;
    const upcoming: any[] = [];
    const overdue: any[] = [];
    const dueSoon: any[] = [];

    for (const inv of Array.isArray(invoices) ? invoices : []) {
      const due = new Date(inv.dueDate).getTime();
      if (Number.isNaN(due)) continue;
      const daysLeft = Math.floor((due - now) / dayMs);

      const item = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        shipmentRef: inv.shipmentRef,
        vendorName: inv.vendorName || inv.transactionVendorName || "—",
        amount: Number(inv.amount) || 0,
        currency: inv.currency || "USD",
        dueDate: inv.dueDate,
        scheduledFor: inv.scheduledFor,
        status: inv.status,
        daysLeft,
        dueSoon: daysLeft >= 0 && daysLeft <= windowDays,
        overdue: daysLeft < 0,
      };

      if (item.overdue) overdue.push(item);
      else if (item.dueSoon) dueSoon.push(item);
      else upcoming.push(item);
    }

    // Scheduled payments due to execute (today or past) that are still queued.
    const scheduledDue: any[] = [];
    for (const inv of [...dueSoon, ...upcoming, ...overdue]) {
      if (inv.status === "scheduled" && inv.scheduledFor) {
        const sched = new Date(inv.scheduledFor).getTime();
        if (!Number.isNaN(sched) && sched <= now) {
          scheduledDue.push({ ...inv, scheduleOverdueDays: Math.floor((now - sched) / dayMs) });
        }
      }
    }

    return NextResponse.json({
      windowDays,
      counts: {
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        upcoming: upcoming.length,
        scheduledDue: scheduledDue.length,
      },
      overdue,
      dueSoon,
      scheduledDue,
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
