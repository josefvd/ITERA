import { NextResponse } from "next/server";
import { useDb } from "@/lib/db";
import { getOcrProvider } from "@/lib/ocr";

// WhatsApp Business API webhook.
// - GET: Meta sends a verification challenge here (hub.mode / hub.verify_token / hub.challenge).
// - POST: Meta delivers inbound messages (text + media) as JSON.
//
// Provider integration points (set env vars):
//   WHATSAPP_PROVIDER  = "meta" | "twilio" | "360dialog" | ...
//   WHATSAPP_VERIFY_TOKEN = your webhook verify token
//   WHATSAPP_TOKEN = your provider access token (used to download media)
//   WHATSAPP_API_URL = e.g. https://graph.facebook.com/v19.0
//
// Media download + OCR pipeline is wired below; it needs a working provider token
// to actually fetch the image bytes from WhatsApp before running OCR.

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";

async function downloadMedia(mediaId: string): Promise<string> {
  // Real implementation: call provider Graph API to get media URL, then download bytes.
  // Mock/example: we throw so it's clear this needs the provider token configured.
  const provider = process.env.WHATSAPP_PROVIDER || "meta";
  const token = process.env.WHATSAPP_TOKEN;
  const apiUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v19.0";
  if (!token) throw new Error("WHATSAPP_TOKEN not configured — cannot download media");
  const res = await fetch(`${apiUrl}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Media download failed (${res.status})`);
  const blob = await res.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const b64 = Buffer.from(arrayBuffer).toString("base64");
  const mime = blob.type || "image/jpeg";
  return `data:${mime};base64,${b64}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sql = useDb();
    const provider = getOcrProvider();
    const results: any[] = [];

    // WhatsApp sends a changes[] array; each change has value.messages[].
    const entries = body?.entry || [];
    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const value = change?.value || {};
        for (const message of value?.messages || []) {
          // Only process image/audio/document message types with media.
          if (message.type === "image" && message.image?.id) {
            const imageData = await downloadMedia(message.image.id);
            const extracted = await provider.extract(imageData, { source: "whatsapp" });

            // Persist the invoice (best-effort — needs a recipient user mapping).
            const id = crypto.randomUUID();
            try {
              const fromNumber = message.from || "";
              // Map phone -> userId is a TODO (needs a Customer/User lookup by phone).
              const txnId = crypto.randomUUID();
              await sql`
                INSERT INTO "Transaction" (id, "userId", "vendorName", amount, currency, status, "paymentMethod", description, "createdAt", "updatedAt", "invoiceRef")
                VALUES (${txnId}, ${`whatsapp:${fromNumber}`}, ${extracted.vendorName || "Desconocido"}, ${extracted.amount || 0}, ${extracted.currency || "USD"}, 'pending', null, ${`Invoice ${extracted.invoiceNumber || ''} vía WhatsApp (conf ${extracted.confidence})`}, NOW(), NOW(), ${extracted.invoiceNumber || null})
              `;
            } catch (e) {
              console.error("Persist invoice from WhatsApp failed:", e);
            }

            results.push({ messageId: message.id, extracted });
          }
        }
      }
    }

    // Respond 200 to acknowledge receipt (Meta requires this promptly).
    return NextResponse.json({ ok: true, processed: results.length });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
