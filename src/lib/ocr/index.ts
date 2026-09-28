// OCR provider registry. Real providers plug in here.
import { OcrProvider } from "./types";
import { MockOcrProvider } from "./providers/mock-ocr";

let _ocrProvider: OcrProvider | null = null;

export function getOcrProvider(): OcrProvider {
  if (!_ocrProvider) {
    const configured = process.env.OCR_PROVIDER;
    if (configured && configured !== "mock_ocr") {
      throw new Error(`OCR provider "${configured}" not implemented yet`);
    }
    _ocrProvider = new MockOcrProvider();
  }
  return _ocrProvider;
}
