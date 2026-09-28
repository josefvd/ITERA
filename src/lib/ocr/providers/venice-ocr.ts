// REAL OCR provider using Venice AI's vision models (OpenAI-compatible API).
// Uses the model configured via OCR_PROVIDER_MODEL (default qwen3-vl for docs).
// Sends the invoice image to a multimodal model and returns structured JSON fields.

import { OcrProvider, ExtractedInvoice } from "../types";

const EXTRACTION_PROMPT = `You are an OCR engine for a freight-payment platform (ITERA).
Extract invoice data from the attached image and return ONLY a JSON object with these exact keys:
- invoiceNumber (string): invoice/factura number
- vendorName (string): the vendor/issuer name
- amount (number): total amount
- currency (string, default "USD")
- dueDate (string, YYYY-MM-DD): payment due date
- confidence (number 0-1): your confidence in the extraction
- rawText (string): the raw visible text
If a field is not visible, omit it. No markdown, no extra text, just the JSON.`;

export class VeniceOcrProvider implements OcrProvider {
  readonly name = "venice_vision";
  private endpoint =
    process.env.OCR_PROVIDER_ENDPOINT || "https://api.venice.ai/api/v1";
  private secret = process.env.OCR_PROVIDER_SECRET || "";
  private model =
    process.env.OCR_PROVIDER_MODEL || "qwen3-vl-235b-a22b";

  async extract(
    imageData: string,
    opts?: { source?: string }
  ): Promise<ExtractedInvoice> {
    if (!this.secret) {
      throw new Error("OCR_PROVIDER_SECRET (Venice API key) is not configured");
    }

    const source = opts?.source || "uploaded_image";

    const res = await fetch(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.secret}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageData },
              },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Venice OCR failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // Parse JSON from the model output (tolerate markdown fences).
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Venice OCR returned no parseable JSON");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Venice OCR returned malformed JSON");
    }

    return {
      invoiceNumber: parsed.invoiceNumber,
      vendorName: parsed.vendorName,
      amount:
        typeof parsed.amount === "number"
          ? parsed.amount
          : parsed.amount
          ? parseFloat(parsed.amount)
          : undefined,
      dueDate: parsed.dueDate,
      currency: parsed.currency || "USD",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
      source,
      rawText: parsed.rawText,
    };
  }
}
