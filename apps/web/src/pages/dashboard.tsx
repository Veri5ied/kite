import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  DepositModal,
  CurrencyBalances,
  PayoutModal,
  RecentTransactions,
} from "../components";
import {
  useWalletBalances,
  useRecentTransactions,
} from "../services/dashboard/hooks";

export default function Page() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const balancesQuery = useWalletBalances();
  const transactionsQuery = useRecentTransactions();
  const isDashboardLoading =
    balancesQuery.isPending || transactionsQuery.isPending;

  const balances = balancesQuery.data?.balances ?? [];
  const totalBalance = Number(
    balancesQuery.data?.summary.totalUsdEquivalent ?? "0",
  );

  if (isDashboardLoading) {
    return (
      <div className="px-8 py-8 max-w-7xl mx-auto animate-pulse">
        <div className="mb-12">
          <div className="h-4 w-24 bg-neutral-100 rounded mb-4" />
          <div className="h-16 w-80 bg-neutral-100 rounded mb-3" />
          <div className="h-4 w-64 bg-neutral-100 rounded" />
        </div>

        <div className="flex gap-3 mb-12">
          <div className="h-11 w-32 bg-neutral-100 rounded" />
          <div className="h-11 w-32 bg-neutral-100 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1 border border-neutral-200 rounded-lg p-6">
            <div className="h-6 w-36 bg-neutral-100 rounded mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 bg-neutral-100 rounded"
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 border border-neutral-200 rounded-lg p-6">
            <div className="h-6 w-40 bg-neutral-100 rounded mb-3" />
            <div className="h-4 w-72 bg-neutral-100 rounded mb-8" />
            <div className="h-12 w-20 bg-neutral-100 rounded" />
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200">
            <div className="h-6 w-40 bg-neutral-100 rounded mb-2" />
            <div className="h-4 w-80 bg-neutral-100 rounded" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 bg-neutral-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Hero Balance Section */}
      <div className="mb-12">
        <div className="mb-2">
          <span className="text-sm text-neutral-500 font-body">
            Total Balance
          </span>
        </div>
        <div className="font-display">
          <h2 className="text-6xl font-light tracking-tight mb-1">
            $
            {totalBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>
        <p className="text-sm text-neutral-500 font-body mt-3">
          USD equivalent across all wallet balances
        </p>
      </div>

      <div className="flex gap-3 mb-12">
        <button
          onClick={() => setShowDepositModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <ArrowDownLeft className="w-4 h-4" />
          Deposit
        </button>
        <button
          onClick={() => setShowPayoutModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          Payout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <CurrencyBalances balances={balances} />
        </div>
        <div className="lg:col-span-2 border border-neutral-200 rounded-lg p-6 h-fit">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Wallet Summary
              </h3>
              <p className="text-sm text-neutral-500 font-body">
                Live balances are derived from the ledger and updated after each
                deposit or payout.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-display mb-2">
                Active Currencies
              </div>
              <div className="font-display text-4xl font-semibold">
                {balances.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h3 className="font-display text-lg font-semibold">
            Recent Activity
          </h3>
          <p className="text-sm text-neutral-500 font-body mt-1">
            Latest deposits, conversions, and payouts from your wallet.
          </p>
        </div>
        <RecentTransactions transactions={transactionsQuery.data?.data ?? []} />
      </div>

      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
      {showPayoutModal && (
        <PayoutModal onClose={() => setShowPayoutModal(false)} />
      )}
    </div>
  );
}
