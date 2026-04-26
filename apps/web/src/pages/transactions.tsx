import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecentTransactions } from "../components";
import type { TransactionItem } from "../services/dashboard/types";

type TransactionType = "deposit" | "conversion" | "payout";
type FilterType = "all" | TransactionType;

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const itemsPerPage = 10;

  const allTransactions: TransactionItem[] = [
    {
      id: "1",
      type: "deposit",
      timestamp: new Date("2026-04-23T14:45:00.000Z").toISOString(),
      amountMinor: "50000",
      sourceAmountMinor: "50000",
      destinationAmountMinor: "50000",
      sourceCurrency: "USD",
      destinationCurrency: "USD",
      status: "COMPLETED",
    },
    {
      id: "2",
      type: "conversion",
      timestamp: new Date("2026-04-22T11:20:00.000Z").toISOString(),
      amountMinor: "42500",
      sourceAmountMinor: "42500",
      destinationAmountMinor: "39100",
      sourceCurrency: "USD",
      destinationCurrency: "EUR",
      status: "COMPLETED",
    },
    {
      id: "3",
      type: "payout",
      timestamp: new Date("2026-04-21T15:15:00.000Z").toISOString(),
      amountMinor: "-120000",
      sourceAmountMinor: "-120000",
      destinationAmountMinor: "-120000",
      sourceCurrency: "NGN",
      destinationCurrency: "NGN",
      status: "SUCCESSFUL",
      recipient: {
        accountName: "Example Beneficiary",
        accountNumber: "1234567891",
        bankCode: "NG001",
      },
    },
    {
      id: "4",
      type: "deposit",
      timestamp: new Date("2026-04-20T09:30:00.000Z").toISOString(),
      amountMinor: "200000",
      sourceAmountMinor: "200000",
      destinationAmountMinor: "200000",
      sourceCurrency: "EUR",
      destinationCurrency: "EUR",
      status: "COMPLETED",
    },
    {
      id: "5",
      type: "conversion",
      timestamp: new Date("2026-04-19T16:50:00.000Z").toISOString(),
      amountMinor: "150000",
      sourceAmountMinor: "150000",
      destinationAmountMinor: "245000000",
      sourceCurrency: "EUR",
      destinationCurrency: "NGN",
      status: "PROCESSING",
    },
    {
      id: "6",
      type: "payout",
      timestamp: new Date("2026-04-18T14:00:00.000Z").toISOString(),
      amountMinor: "-75000",
      sourceAmountMinor: "-75000",
      destinationAmountMinor: "-75000",
      sourceCurrency: "KES",
      destinationCurrency: "KES",
      status: "PENDING",
      recipient: {
        accountName: "Mobile Wallet",
        accountNumber: "9876543210",
        bankCode: "KE001",
      },
    },
    {
      id: "7",
      type: "deposit",
      timestamp: new Date("2026-04-17T13:30:00.000Z").toISOString(),
      amountMinor: "150000",
      sourceAmountMinor: "150000",
      destinationAmountMinor: "150000",
      sourceCurrency: "GBP",
      destinationCurrency: "GBP",
      status: "COMPLETED",
    },
    {
      id: "8",
      type: "conversion",
      timestamp: new Date("2026-04-16T10:15:00.000Z").toISOString(),
      amountMinor: "80000",
      sourceAmountMinor: "80000",
      destinationAmountMinor: "13792000",
      sourceCurrency: "GBP",
      destinationCurrency: "KES",
      status: "COMPLETED",
    },
    {
      id: "9",
      type: "payout",
      timestamp: new Date("2026-04-15T17:20:00.000Z").toISOString(),
      amountMinor: "-200000",
      sourceAmountMinor: "-200000",
      destinationAmountMinor: "-200000",
      sourceCurrency: "NGN",
      destinationCurrency: "NGN",
      status: "SUCCESSFUL",
      recipient: {
        accountName: "Wallet Transfer",
        accountNumber: "1029384756",
        bankCode: "NG002",
      },
    },
    {
      id: "10",
      type: "deposit",
      timestamp: new Date("2026-04-14T08:00:00.000Z").toISOString(),
      amountMinor: "350000",
      sourceAmountMinor: "350000",
      destinationAmountMinor: "350000",
      sourceCurrency: "USD",
      destinationCurrency: "USD",
      status: "COMPLETED",
    },
    {
      id: "11",
      type: "conversion",
      timestamp: new Date("2026-04-13T15:45:00.000Z").toISOString(),
      amountMinor: "60000",
      sourceAmountMinor: "60000",
      destinationAmountMinor: "47250",
      sourceCurrency: "USD",
      destinationCurrency: "GBP",
      status: "PROCESSING",
    },
    {
      id: "12",
      type: "payout",
      timestamp: new Date("2026-04-12T11:00:00.000Z").toISOString(),
      amountMinor: "-95000",
      sourceAmountMinor: "-95000",
      destinationAmountMinor: "-95000",
      sourceCurrency: "NGN",
      destinationCurrency: "NGN",
      status: "SUCCESSFUL",
      recipient: {
        accountName: "Beneficiary",
        accountNumber: "4455667788",
        bankCode: "NG003",
      },
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
