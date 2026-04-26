import { useState } from "react";
import { X } from "lucide-react";
import { useCreateDeposit } from "../services/dashboard/hooks";
import type { SupportedCurrency } from "../services/dashboard/types";
import { type ModalProps } from "../lib/utils";

export default function DepositModal({ onClose }: ModalProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const createDeposit = useCreateDeposit(onClose);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await createDeposit.mutateAsync({
      amount,
      currency,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="font-display text-xl font-semibold">Deposit Funds</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-display font-medium mb-2">
              Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={createDeposit.isPending}
                className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as SupportedCurrency)
                }
                disabled={createDeposit.isPending}
                className="px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>NGN</option>
                <option>KES</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
            <p className="text-xs text-neutral-600 font-body">
              Deposits are simulated in this environment and will credit the
              selected wallet balance immediately.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createDeposit.isPending}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || createDeposit.isPending}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createDeposit.isPending ? "Depositing..." : "Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
