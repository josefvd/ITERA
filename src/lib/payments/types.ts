// Pluggable payment provider abstraction for ITERA.
// Real providers (Stripe, Pagaditos, bank aggregators) plug in here later
// via env vars. The mock providers simulate success for development.

export interface CardDetails {
  cardNumber: string;
  cardHolder: string;
  expiry: string; // MM/YY
  cvc: string;
  brand?: string;
}

export interface RegisterCardResult {
  providerRef: string;
  last4: string;
  brand: string;
  expiry: string;
}

export interface ChargeResult {
  providerRef: string;
  status: "completed" | "failed";
  message?: string;
}

export interface BankLinkDetails {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  accountHolder?: string;
  accountType?: string; // checking | savings
}

export interface LinkedBankResult {
  providerRef: string;
  bankName: string;
  accountNumberLast4: string;
  verified: boolean;
}

export interface PaymentProvider {
  readonly name: string;
  registerCard(details: CardDetails): Promise<RegisterCardResult>;
  charge(opts: {
    providerRef: string;
    amount: number;
    currency?: string;
    description?: string;
  }): Promise<ChargeResult>;
  deleteMethod(providerRef: string): Promise<boolean>;
}

export interface BankProvider {
  readonly name: string;
  linkAccount(details: BankLinkDetails): Promise<LinkedBankResult>;
  verifyAccount(providerRef: string): Promise<{ verified: boolean }>;
  listAccounts(userId: string): Promise<LinkedBankResult[]>;
  unlinkAccount(providerRef: string): Promise<boolean>;
}
