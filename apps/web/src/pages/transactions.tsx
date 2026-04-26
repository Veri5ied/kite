import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecentTransactions } from "../components";

type TransactionType = "deposit" | "conversion" | "payout";
type TransactionStatus = "complete" | "processing" | "pending";
type Transaction = {
  id: string;
  title: string;
  type: TransactionType;
  date: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
};
type FilterType = "all" | TransactionType;

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const itemsPerPage = 10;

  const allTransactions: Transaction[] = [
    {
      id: "1",
      title: "Deposit from Stripe",
      type: "deposit",
      date: "Apr 23, 2:45 PM",
      amount: 500.0,
      currency: "USD",
      status: "complete",
    },
    {
      id: "2",
      title: "Convert USD → EUR",
      type: "conversion",
      date: "Apr 22, 11:20 AM",
      amount: -425.0,
      currency: "USD",
      status: "complete",
    },
    {
      id: "3",
      title: "Payout to Bank",
      type: "payout",
      date: "Apr 21, 3:15 PM",
      amount: -1200.0,
      currency: "GBP",
      status: "complete",
    },
    {
      id: "4",
      title: "Deposit from Bank",
      type: "deposit",
      date: "Apr 20, 9:30 AM",
      amount: 2000.0,
      currency: "EUR",
      status: "complete",
    },
    {
      id: "5",
      title: "Convert EUR → NGN",
      type: "conversion",
      date: "Apr 19, 4:50 PM",
      amount: -1500.0,
      currency: "EUR",
      status: "processing",
    },
    {
      id: "6",
      title: "Payout to Account",
      type: "payout",
      date: "Apr 18, 2:00 PM",
      amount: -750.0,
      currency: "USD",
      status: "pending",
    },
    {
      id: "7",
      title: "Deposit from Card",
      type: "deposit",
      date: "Apr 17, 1:30 PM",
      amount: 1500.0,
      currency: "GBP",
      status: "complete",
    },
    {
      id: "8",
      title: "Convert GBP → KES",
      type: "conversion",
      date: "Apr 16, 10:15 AM",
      amount: -800.0,
      currency: "GBP",
      status: "complete",
    },
    {
      id: "9",
      title: "Payout to Wallet",
      type: "payout",
      date: "Apr 15, 5:20 PM",
      amount: -2000.0,
      currency: "EUR",
      status: "complete",
    },
    {
      id: "10",
      title: "Deposit ACH",
      type: "deposit",
      date: "Apr 14, 8:00 AM",
      amount: 3500.0,
      currency: "USD",
      status: "complete",
    },
    {
      id: "11",
      title: "Convert USD → GBP",
      type: "conversion",
      date: "Apr 13, 3:45 PM",
      amount: -600.0,
      currency: "USD",
      status: "processing",
    },
    {
      id: "12",
      title: "Payout to Beneficiary",
      type: "payout",
      date: "Apr 12, 11:00 AM",
      amount: -950.0,
      currency: "NGN",
      status: "complete",
    },
  ];

  const filteredTransactions = useMemo(() => {
    if (filterType === "all") return allTransactions;
    return allTransactions.filter((tx) => tx.type === filterType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <span className="text-sm text-neutral-600 font-body">Filter:</span>
        <div className="flex gap-2">
          {(
            [
              { label: "All", value: "all" as const },
              { label: "Deposits", value: "deposit" as const },
              { label: "Conversions", value: "conversion" as const },
              { label: "Payouts", value: "payout" as const },
            ] as const
          ).map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setFilterType(filter.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded text-sm font-display font-medium transition-colors ${
                filterType === filter.value
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-black hover:bg-neutral-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      {paginatedTransactions.length > 0 ? (
        <>
          <div className="border border-neutral-200 rounded-lg overflow-hidden mb-8">
            <RecentTransactions transactions={paginatedTransactions} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 font-body">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filteredTransactions.length,
              )}{" "}
              of {filteredTransactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded text-sm font-display font-medium transition-colors ${
                      currentPage === i + 1
                        ? "bg-black text-white"
                        : "border border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-600 font-body">No transactions found</p>
        </div>
      )}
    </div>
  );
}
