// Payment provider registry. Real providers plug in here.
import { PaymentProvider, BankProvider } from "./types";
import { MockCardPaymentProvider } from "./providers/mock-card";
import { MockBankAccountProvider } from "./providers/mock-bank";

// In the future: switch on process.env.CARD_PROVIDER to load a real gateway.
let _cardProvider: PaymentProvider | null = null;
let _bankProvider: BankProvider | null = null;

export function getCardProvider(): PaymentProvider {
  if (!_cardProvider) {
    const configured = process.env.CARD_PROVIDER;
    if (configured && configured !== "mock_card") {
      // Real provider hook point — implement and import when keys exist.
      throw new Error(`Card provider "${configured}" not implemented yet`);
    }
    _cardProvider = new MockCardPaymentProvider();
  }
  return _cardProvider;
}

export function getBankProvider(): BankProvider {
  if (!_bankProvider) {
    const configured = process.env.BANK_PROVIDER;
    if (configured && configured !== "mock_bank") {
      throw new Error(`Bank provider "${configured}" not implemented yet`);
    }
    _bankProvider = new MockBankAccountProvider();
  }
  return _bankProvider;
}

export { EL_SALVADOR_BANKS } from "./providers/mock-bank";
