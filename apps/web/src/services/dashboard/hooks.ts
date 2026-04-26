import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../../lib/http";
import {
  balancesQueryOptions,
  dashboardKeys,
  depositMutationOptions,
  payoutMutationOptions,
  recentTransactionsQueryOptions,
} from "./queries";

export function useWalletBalances() {
  return useQuery(balancesQueryOptions());
}

export function useRecentTransactions() {
  return useQuery(recentTransactionsQueryOptions());
}

export function useCreateDeposit(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    ...depositMutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardKeys.balances() }),
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.transactions(),
        }),
      ]);
      toast.success("Deposit submitted successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCreatePayout(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    ...payoutMutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardKeys.balances() }),
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.transactions(),
        }),
      ]);
      toast.success("Payout created successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
