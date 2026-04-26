import { api } from "../../lib/api";
import type {
  CreateQuoteInput,
  CreateQuoteResponse,
  CreateDepositInput,
  CreatePayoutInput,
  ExecuteQuoteInput,
  ExecuteQuoteResponse,
  TransactionsResponse,
  WalletBalancesResponse,
} from "./types";

export async function getWalletBalances() {
  const response = await api.get<WalletBalancesResponse>("/wallets/balances");

  return response.data;
}

export async function getRecentTransactions() {
  const response = await api.get<TransactionsResponse>("/transactions", {
    params: {
      limit: 4,
    },
  });

  return response.data;
}

export async function getTransactions(limit = 100) {
  const response = await api.get<TransactionsResponse>("/transactions", {
    params: {
      limit,
    },
  });

  return response.data;
}

export async function createDeposit(input: CreateDepositInput) {
  const response = await api.post("/deposits", input, {
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
  });

  return response.data;
}

export async function createPayout(input: CreatePayoutInput) {
  const response = await api.post("/payouts", input);

  return response.data;
}

export async function createQuote(input: CreateQuoteInput) {
  const response = await api.post<CreateQuoteResponse>(
    "/conversions/quote",
    input,
  );

  return response.data;
}

export async function executeQuote(input: ExecuteQuoteInput) {
  const response = await api.post<ExecuteQuoteResponse>(
    "/conversions/execute",
    input,
  );

  return response.data;
}
