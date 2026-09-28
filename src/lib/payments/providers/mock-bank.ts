// MOCK bank provider — simulates linking/verifying El Salvador bank accounts.
// Swap in a real bank aggregator (open banking) when available.

import { BankProvider, BankLinkDetails, LinkedBankResult } from "../types";

export const EL_SALVADOR_BANKS = [
  "Banco Agrícola",
  "Banco Cuscatlán",
  "Banco G&T Continental",
  "Banco Promerica",
  "Banco Davivienda",
  "BAC Credomatic",
  "Banco de Fomento Agropecuario",
  "Banco Hipotecario",
  "Banco Azul",
  "Cuscatlán TBI",
];

function last4(n: string): string {
  return n.replace(/\s+/g, "").slice(-4);
}

export class MockBankAccountProvider implements BankProvider {
  readonly name = "mock_bank";
  private provider = process.env.BANK_PROVIDER || "mock_bank";
  private endpoint = process.env.BANK_PROVIDER_ENDPOINT;
  private secret = process.env.BANK_PROVIDER_SECRET;

  async linkAccount(details: BankLinkDetails): Promise<LinkedBankResult> {
    if (!details.bankName || !details.accountNumber) {
      throw new Error("Banco y número de cuenta son obligatorios");
    }
    const digits = details.accountNumber.replace(/\D/g, "");
    if (digits.length < 6) {
      throw new Error("Número de cuenta inválido (mínimo 6 dígitos)");
    }
    return {
      providerRef: `mockbank_${Math.random().toString(36).slice(2, 14)}`,
      bankName: details.bankName,
      accountNumberLast4: last4(digits),
      verified: true,
    };
  }

  async verifyAccount(providerRef: string): Promise<{ verified: boolean }> {
    return { verified: true };
  }

  async listAccounts(userId: string): Promise<LinkedBankResult[]> {
    return [];
  }

  async unlinkAccount(providerRef: string): Promise<boolean> {
    return true;
  }
}
