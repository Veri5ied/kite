export type SupportedCurrency = "USD" | "GBP" | "EUR" | "NGN" | "KES";

export type WalletBalance = {
  accountId: string;
  currency: SupportedCurrency;
  code: string;
  amountMinor: string;
  amount: string;
  usdEquivalentMinor: string;
};

export type WalletBalancesResponse = {
  wallet: {
    id: string;
  };
  balances: WalletBalance[];
  summary: {
    totalUsdEquivalentMinor: string;
    totalUsdEquivalent: string;
  };
};

export type TransactionItem = {
  id: string;
  type: "deposit" | "conversion" | "payout";
  status: string;
  amountMinor: string;
  sourceAmountMinor: string;
  destinationAmountMinor: string;
  sourceCurrency: SupportedCurrency;
  destinationCurrency: SupportedCurrency;
  timestamp: string;
  account?: {
    id: string;
    code: string;
    currency: SupportedCurrency;
  };
  recipient?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
  failureReason?: string | null;
};

export type TransactionsResponse = {
  data: TransactionItem[];
  page: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export type CreateDepositInput = {
  currency: SupportedCurrency;
  amount: string;
};

export type CreatePayoutInput = {
  sourceCurrency: Extract<SupportedCurrency, "NGN" | "KES">;
  amount: string;
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientAccountName: string;
};
