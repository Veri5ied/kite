import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecentTransactions } from "../components";
import { useTransactions } from "../services/dashboard/hooks";

type TransactionType = "deposit" | "conversion" | "payout";
type FilterType = "all" | TransactionType;

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const itemsPerPage = 10;
  const transactionsQuery = useTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allTransactions = transactionsQuery.data?.data ?? [];

  const filteredTransactions = useMemo(() => {
    if (filterType === "all") return allTransactions;
    return allTransactions.filter((tx) => tx.type === filterType);
  }, [allTransactions, filterType]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (totalPages === 0) {
      return;
    }

    if (currentPage > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (transactionsQuery.isPending) {
    return (
      <div className="px-8 py-8 max-w-7xl mx-auto animate-pulse">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-4 w-14 bg-neutral-100 rounded" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 w-24 bg-neutral-100 rounded" />
            ))}
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-hidden mb-8 p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 bg-neutral-100 rounded" />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="h-4 w-64 bg-neutral-100 rounded" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-neutral-100 rounded" />
            <div className="h-10 w-28 bg-neutral-100 rounded" />
            <div className="h-10 w-10 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

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
