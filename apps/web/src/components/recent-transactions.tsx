import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from "lucide-react";
import type { TransactionItem } from "../services/dashboard/types";

export default function RecentTransactions({
  transactions,
}: {
  transactions: TransactionItem[];
}) {
  const getTransactionIcon = (type: "deposit" | "payout" | "conversion") => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4" />;
      case "payout":
        return <ArrowUpRight className="w-4 h-4" />;
      case "conversion":
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "complete":
      case "successful":
        return "status-complete";
      case "processing":
        return "status-processing";
      case "pending":
        return "status-pending";
      default:
        return "status-complete";
    }
  };

  const formatMinorAmount = (amountMinor: string) => {
    const amount = Number(amountMinor) / 100;
    const sign = amount > 0 ? "+" : "";

    return `${sign}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTitle = (tx: TransactionItem) => {
    if (tx.type === "deposit") {
      return `Deposit · ${tx.sourceCurrency}`;
    }

    if (tx.type === "conversion") {
      return `Conversion · ${tx.sourceCurrency} → ${tx.destinationCurrency}`;
    }

    return tx.recipient
      ? `Payout · ${tx.recipient.bankCode} · ${tx.recipient.accountName}`
      : `Payout · ${tx.sourceCurrency}`;
  };

  return (
    <div className="divide-y divide-neutral-100">
      {transactions.map((tx) => (
        <div key={tx.id} className="px-6 transaction-row">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
              {getTransactionIcon(tx.type)}
            </div>
            <div className="flex-1">
              <div className="font-display font-medium">{getTitle(tx)}</div>
              <div className="text-xs text-neutral-500 font-body mt-0.5">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-display font-semibold">
                {formatMinorAmount(tx.amountMinor)} {tx.sourceCurrency}
              </div>
            </div>
            <span className={`status-badge ${getStatusColor(tx.status)}`}>
              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
