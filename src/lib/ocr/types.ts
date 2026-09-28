// Pluggable OCR provider for invoice/document data extraction.
// Real providers (e.g. cloud vision/OCR APIs) plug in here via env vars.
// The mock provider returns deterministic sample fields for development.

export interface ExtractedInvoice {
  invoiceNumber?: string;
  vendorName?: string;
  amount?: number;
  dueDate?: string; // ISO date
  currency?: string;
  confidence: number;
  source: string; // "uploaded_image" | "whatsapp" | "email"
  rawText?: string;
}

export interface OcrProvider {
  readonly name: string;
  /**
   * Extract invoice fields from an image (as a data URL or base64 string).
   * In production this posts to a vision/OCR API with the configured key.
   */
  extract(
    imageData: string,
    opts?: { source?: string }
  ): Promise<ExtractedInvoice>;
}
