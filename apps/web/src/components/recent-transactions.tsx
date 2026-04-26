import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from "lucide-react";

type transactionsProps = {
  id: string;
  title: string;
  date: string;
  amount: number;
  currency: string;
  type: "deposit" | "payout" | "conversion";
  status: "complete" | "processing" | "pending";
}[];

export default function RecentTransactions({
  transactions,
}: {
  transactions: transactionsProps;
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

  const getStatusColor = (status: "complete" | "processing" | "pending") => {
    switch (status) {
      case "complete":
        return "status-complete";
      case "processing":
        return "status-processing";
      case "pending":
        return "status-pending";
      default:
        return "status-complete";
    }
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
              <div className="font-display font-medium">{tx.title}</div>
              <div className="text-xs text-neutral-500 font-body mt-0.5">
                {tx.date}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-display font-semibold">
                {tx.amount} {tx.currency}
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
