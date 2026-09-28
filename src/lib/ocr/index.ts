// OCR provider registry. Real providers plug in here.
import { OcrProvider } from "./types";
import { MockOcrProvider } from "./providers/mock-ocr";
import { VeniceOcrProvider } from "./providers/venice-ocr";

let _ocrProvider: OcrProvider | null = null;

export function getOcrProvider(): OcrProvider {
  if (!_ocrProvider) {
    const configured = process.env.OCR_PROVIDER || "mock_ocr";
    if (configured === "venice_vision") {
      _ocrProvider = new VeniceOcrProvider();
    } else if (configured === "mock_ocr") {
      _ocrProvider = new MockOcrProvider();
    } else {
      throw new Error(`OCR provider "${configured}" not implemented`);
    }
  }
  return _ocrProvider;
}
