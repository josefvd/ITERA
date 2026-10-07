import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { useDb } from "@/lib/db";
import { createVendorPostHandler } from "@/lib/transaction-handlers";

type Vendor = { id: string; name: string; billingEmail: string; createdAt?: string; updatedAt?: string };

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const vendors = await useDb()`SELECT id, name, "billingEmail" FROM "Vendor" WHERE "userId" = ${auth.userId} ORDER BY name` as Vendor[];
    return NextResponse.json({ vendors: Array.isArray(vendors) ? vendors : [] });
  } catch (error) {
    console.error("Get vendors error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await createVendorPostHandler({
      getAuth: getAuthUser,
      async create(userId, vendor) {
        const id = crypto.randomUUID();
        const [saved] = await useDb()`INSERT INTO "Vendor" (id, "userId", name, "billingEmail", "createdAt", "updatedAt") VALUES (${id}, ${userId}, ${vendor.name}, ${vendor.billingEmail}, NOW(), NOW()) RETURNING id, name, "billingEmail"` as Vendor[];
        return saved;
      },
    })(request);
  } catch (error) {
    console.error("Create vendor error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
