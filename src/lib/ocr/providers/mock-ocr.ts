// MOCK OCR provider — simulates data extraction for development.
// In production, connect a real vision/OCR API here (e.g. OpenAI vision,
// Google Cloud Vision, AWS Textract) and return real parsed fields.

import { OcrProvider, ExtractedInvoice } from "../types";

function randomConfidence(): number {
  return Number((0.82 + Math.random() * 0.16).toFixed(2));
}

export class MockOcrProvider implements OcrProvider {
  readonly name = "mock_ocr";
  private provider = process.env.OCR_PROVIDER || "mock_ocr";
  private endpoint = process.env.OCR_PROVIDER_ENDPOINT;
  private secret = process.env.OCR_PROVIDER_SECRET;

  async extract(
    imageData: string,
    opts?: { source?: string }
  ): Promise<ExtractedInvoice> {
    const source = opts?.source || "uploaded_image";

    // Real integration would send imageData to the configured endpoint.
    // Mock: return plausible sample fields regardless of content.
    const base = Math.floor(500 + Math.random() * 9000);
    const vendorSamples = [
      "Maersk Line",
      "Dirección de Aduanas",
      "Terminal de Puerto",
      "Transportes Centroamérica",
      "DHL Logistics",
    ];
    const vendorName = vendorSamples[Math.floor(Math.random() * vendorSamples.length)];

    return {
      invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 89999)}`,
      vendorName,
      amount: base + Math.floor(Math.random() * 99),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      currency: "USD",
      confidence: randomConfidence(),
      source,
      rawText: "[Datos simulados por el provider OCR mock]",
    };
  }
}
