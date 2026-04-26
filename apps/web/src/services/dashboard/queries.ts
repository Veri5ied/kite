import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  createDeposit,
  createPayout,
  getRecentTransactions,
  getWalletBalances,
} from "./api";
import type { CreateDepositInput, CreatePayoutInput } from "./types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  balances: () => [...dashboardKeys.all, "balances"] as const,
  transactions: () => [...dashboardKeys.all, "transactions"] as const,
  deposit: () => [...dashboardKeys.all, "deposit"] as const,
  payout: () => [...dashboardKeys.all, "payout"] as const,
};

export function balancesQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.balances(),
    queryFn: getWalletBalances,
    staleTime: 30_000,
  });
}

export function recentTransactionsQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.transactions(),
    queryFn: getRecentTransactions,
    staleTime: 15_000,
  });
}

export function depositMutationOptions() {
  return mutationOptions({
    mutationKey: dashboardKeys.deposit(),
    mutationFn: (input: CreateDepositInput) => createDeposit(input),
  });
}

export function payoutMutationOptions() {
  return mutationOptions({
    mutationKey: dashboardKeys.payout(),
    mutationFn: (input: CreatePayoutInput) => createPayout(input),
  });
}
