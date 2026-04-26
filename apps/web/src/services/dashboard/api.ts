import { api } from "../../lib/api";
import type {
  CreateDepositInput,
  CreatePayoutInput,
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
