import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  DepositModal,
  PayoutModal,
  QuickConvert,
  CurrencyBalances,
  RecentTransactions,
} from "../components";

type Balance = {
  currency: "USD" | "EUR" | "GBP" | "NGN" | "KES";
  amount: number;
};

type TransactionType = "deposit" | "conversion" | "payout";
type TransactionStatus = "complete" | "processing" | "pending";

type Transaction = {
  id: string;
  title: string;
  date: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
};

export default function Page() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const totalBalance = 12847.32;
  const balances: Balance[] = [
    { currency: "USD", amount: 5234.5 },
    { currency: "EUR", amount: 2156.8 },
    { currency: "GBP", amount: 1894.25 },
    { currency: "NGN", amount: 2450000 },
    { currency: "KES", amount: 1561440 },
  ];

  const transactions: Transaction[] = [
    {
      id: "1",
      title: "Deposit from Stripe",
      date: "Apr 23, 2:45 PM",
      amount: 500.0,
      currency: "USD",
      type: "deposit",
      status: "complete",
    },
    {
      id: "2",
      title: "Convert USD → EUR",
      date: "Apr 22, 11:20 AM",
      amount: 425.0,
      currency: "USD",
      type: "conversion",
      status: "complete",
    },
    {
      id: "3",
      title: "Payout to Bank",
      date: "Apr 21, 3:15 PM",
      amount: 1200.0,
      currency: "GBP",
      type: "payout",
      status: "complete",
    },
    {
      id: "4",
      title: "Deposit from Bank",
      date: "Apr 20, 9:30 AM",
      amount: 2000.0,
      currency: "EUR",
      type: "deposit",
      status: "complete",
    },
    {
      id: "5",
      title: "Convert EUR → NGN",
      date: "Apr 19, 4:50 PM",
      amount: 1500.0,
      currency: "EUR",
      type: "conversion",
      status: "processing",
    },
    {
      id: "6",
      title: "Payout to Account",
      date: "Apr 18, 2:00 PM",
      amount: 750.0,
      currency: "USD",
      type: "payout",
      status: "pending",
    },
  ];

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
          Across all your wallets
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

      <div className="grid grid-cols-3 gap-8 mb-12">
        <div className="col-span-2">
          <QuickConvert />
        </div>
        <div className="col-span-1">
          <CurrencyBalances balances={balances} />
        </div>
      </div>

      <RecentTransactions transactions={transactions.slice(0, 4)} />

      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
      {showPayoutModal && (
        <PayoutModal onClose={() => setShowPayoutModal(false)} />
      )}
    </div>
  );
}
