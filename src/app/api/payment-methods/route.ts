import { NextResponse } from "next/server";
import { useDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCardProvider } from "@/lib/payments";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sql = useDb();
    const methods = await sql`
      SELECT * FROM "PaymentMethod" WHERE "userId" = ${auth.userId}
      ORDER BY "createdAt" DESC
    `;
    return NextResponse.json({ methods: Array.isArray(methods) ? methods : [] });
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cardNumber, cardHolder, expiry, cvc, makeDefault } = await request.json();
    if (!cardNumber || !cardHolder || !expiry || !cvc) {
      return NextResponse.json(
        { error: "Datos de tarjeta incompletos" },
        { status: 400 }
      );
    }

    const provider = getCardProvider();
    const registered = await provider.registerCard({
      cardNumber,
      cardHolder,
      expiry,
      cvc,
    });

    const sql = useDb();
    const id = crypto.randomUUID();

    // If making this the default, clear other defaults first.
    if (makeDefault) {
      await sql`
        UPDATE "PaymentMethod" SET "isDefault" = false WHERE "userId" = ${auth.userId}
      `;
    }

    await sql`
      INSERT INTO "PaymentMethod" (id, "userId", type, provider, "providerRef", "cardLast4", "cardBrand", "cardExpiry", "isDefault", "createdAt", "updatedAt")
      VALUES (${id}, ${auth.userId}, 'card', ${provider.name}, ${registered.providerRef}, ${registered.last4}, ${registered.brand}, ${registered.expiry}, ${!!makeDefault}, NOW(), NOW())
    `;

    const result = await sql`SELECT * FROM "PaymentMethod" WHERE id = ${id}`;
    const method = Array.isArray(result) && result.length > 0 ? result[0] : null;

    return NextResponse.json({ method }, { status: 201 });
  } catch (error: any) {
    console.error("Register card error:", error);
    const msg = error?.message || "Internal server error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
