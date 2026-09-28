// MOCK card payment provider — simulates a real gateway for development.
// Swap in a real gateway (Stripe/Pagaditos) by implementing PaymentProvider
// and registering it in index.ts when API keys are available.

import {
  PaymentProvider,
  CardDetails,
  RegisterCardResult,
  ChargeResult,
} from "../types";

function last4(num: string): string {
  return num.replace(/\s+/g, "").slice(-4);
}

function detectBrand(num: string): string {
  const n = num.replace(/\s+/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "Card";
}

export class MockCardPaymentProvider implements PaymentProvider {
  readonly name = "mock_card";
  private provider = process.env.CARD_PROVIDER || "mock_card";
  private endpoint = process.env.CARD_PROVIDER_ENDPOINT;
  private secret = process.env.CARD_PROVIDER_SECRET;

  async registerCard(details: CardDetails): Promise<RegisterCardResult> {
    // In a real integration this would POST to endpoint with secret.
    // Mock: validate basic fields, return a fake token.
    if (!details.cardNumber || details.cardNumber.replace(/\s/g, "").length < 12) {
      throw new Error("Número de tarjeta inválido");
    }
    if (!details.expiry || !details.cvc) {
      throw new Error("Datos de tarjeta incompletos");
    }
    return {
      providerRef: `mockcard_${Math.random().toString(36).slice(2, 14)}`,
      last4: last4(details.cardNumber),
      brand: details.brand || detectBrand(details.cardNumber),
      expiry: details.expiry,
    };
  }

  async charge(opts: {
    providerRef: string;
    amount: number;
    currency?: string;
    description?: string;
  }): Promise<ChargeResult> {
    // Mock: always succeed for amounts below a safety cap.
    if (opts.amount <= 0) {
      return { providerRef: opts.providerRef, status: "failed", message: "Monto inválido" };
    }
    return {
      providerRef: opts.providerRef,
      status: "completed",
      message: `Cargo de ${opts.amount} ${opts.currency || "USD"} aprobado`,
    };
  }

  async deleteMethod(providerRef: string): Promise<boolean> {
    return true;
  }
}
