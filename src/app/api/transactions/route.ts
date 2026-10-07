import { NextResponse } from "next/server";
import { useDb as getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { createTransactionPostHandler } from "@/lib/transaction-handlers";

type TransactionRecord = Record<string, unknown>;
type VendorRecord = { id: string; name: string; billingEmail: string };

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const transactions = await getDb()`SELECT id, "userId", "vendorId", "vendorName", "vendorEmail", amount, currency, status, "paymentMethod", description, "serviceType", "referenceType", "referenceNumber", "relatedReference", "commercialValue", "scheduledFor", "createdAt", "updatedAt" FROM "Transaction" WHERE "userId" = ${auth.userId} ORDER BY "createdAt" DESC LIMIT 50` as TransactionRecord[];
    return NextResponse.json({ transactions: Array.isArray(transactions) ? transactions : [] });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await createTransactionPostHandler({
      getAuth: getAuthUser,
      async create(userId, value) {
        const sql = getDb();
        const [vendor] = await sql`SELECT id, name, "billingEmail" FROM "Vendor" WHERE id = ${value.vendorId} AND "userId" = ${userId}` as VendorRecord[];
        if (!vendor) return null;
        const id = crypto.randomUUID();
        const [transaction] = await sql`
          INSERT INTO "Transaction" (id, "userId", "vendorId", "vendorName", "vendorEmail", amount, currency, status, "paymentMethod", description, "serviceType", "referenceType", "referenceNumber", "relatedReference", "commercialValue", "scheduledFor", "createdAt", "updatedAt")
          VALUES (${id}, ${userId}, ${vendor.id}, ${vendor.name}, ${vendor.billingEmail}, ${value.amount}, 'USD', ${value.status}, ${value.paymentMethod}, ${value.description}, ${value.serviceType}, ${value.referenceType}, ${value.referenceNumber}, ${value.relatedReference}, ${value.commercialValue}, ${value.scheduledFor}, NOW(), NOW())
          RETURNING id, "userId", "vendorId", "vendorName", "vendorEmail", amount, currency, status, "paymentMethod", description, "serviceType", "referenceType", "referenceNumber", "relatedReference", "commercialValue", "scheduledFor", "createdAt", "updatedAt"
        ` as TransactionRecord[];
        if (!transaction) throw new Error("Transaction insert returned no row");
        return transaction;
      },
    })(request);
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
