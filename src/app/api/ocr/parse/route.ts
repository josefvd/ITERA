import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getOcrProvider } from "@/lib/ocr";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Accept either JSON (base64 imageData) or multipart form (file).
    let imageData = "";
    let source = "uploaded_image";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageData = body.imageData || "";
      source = body.source || "uploaded_image"; // uploaded_image | whatsapp | email
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      source = (form.get("source") as string) || "uploaded_image";
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageData = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "Se requiere una imagen de factura" },
        { status: 400 }
      );
    }

    // Normalize source for messaging channels
    const normalizedSource =
      source === "whatsapp"
        ? "whatsapp"
        : source === "email"
        ? "email"
        : "uploaded_image";

    const provider = getOcrProvider();
    const extracted = await provider.extract(imageData, { source: normalizedSource });

    return NextResponse.json({ ok: true, extracted });
  } catch (error: any) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 400 }
    );
  }
}
