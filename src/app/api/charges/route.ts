import { NextResponse } from "next/server";
import { useDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCardProvider } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { paymentMethodId, amount, currency, description } = await request.json();
    if (!paymentMethodId || !amount) {
      return NextResponse.json(
        { error: "Método de pago y monto son obligatorios" },
        { status: 400 }
      );
    }

    const sql = useDb();
    const methods = await sql`
      SELECT * FROM "PaymentMethod" WHERE id = ${paymentMethodId} AND "userId" = ${auth.userId}
    `;
    const method = Array.isArray(methods) && methods.length > 0 ? (methods[0] as any) : null;
    if (!method) {
      return NextResponse.json({ error: "Método de pago no encontrado" }, { status: 404 });
    }

    const provider = getCardProvider();
    const result = await provider.charge({
      providerRef: method.providerRef,
      amount: parseFloat(amount),
      currency: currency || "USD",
      description: description || "Pago ITERA",
    });

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.message || "Cargo rechazado" },
        { status: 402 }
      );
    }

    return NextResponse.json({ charge: result }, { status: 201 });
  } catch (error: any) {
    console.error("Charge error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 400 });
  }
}
