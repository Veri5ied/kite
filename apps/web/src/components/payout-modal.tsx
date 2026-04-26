import { useState } from "react";
import { X } from "lucide-react";
import { useCreatePayout } from "../services/dashboard/hooks";
import { type ModalProps } from "../lib/utils";

export default function PayoutModal({ onClose }: ModalProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"NGN" | "KES">("NGN");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [recipientBankCode, setRecipientBankCode] = useState("NG001");
  const createPayout = useCreatePayout(onClose);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await createPayout.mutateAsync({
      sourceCurrency: currency,
      amount,
      recipientAccountName: recipientName,
      recipientAccountNumber,
      recipientBankCode,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="font-display text-xl font-semibold">Payout Funds</h2>
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
              Recipient Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Doe"
              disabled={createPayout.isPending}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-display font-medium mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={recipientAccountNumber}
              onChange={(e) => setRecipientAccountNumber(e.target.value)}
              placeholder="1234567890"
              disabled={createPayout.isPending}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-display font-medium mb-2">
              Bank Code
            </label>
            <input
              type="text"
              value={recipientBankCode}
              onChange={(e) =>
                setRecipientBankCode(e.target.value.toUpperCase())
              }
              placeholder={currency === "NGN" ? "NG001" : "KE001"}
              disabled={createPayout.isPending}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

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
                disabled={createPayout.isPending}
                className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
              <select
                value={currency}
                onChange={(e) => {
                  const nextCurrency = e.target.value as "NGN" | "KES";
                  setCurrency(nextCurrency);
                  setRecipientBankCode(
                    nextCurrency === "NGN" ? "NG001" : "KE001",
                  );
                }}
                disabled={createPayout.isPending}
                className="px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option>NGN</option>
                <option>KES</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
            <p className="text-xs text-neutral-600 font-body">
              Use a bank code starting with {currency === "NGN" ? "NG" : "KE"}.
              Account numbers ending in 0 will fail in this sandbox so you can
              test reversal flows.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createPayout.isPending}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !amount ||
                !recipientName ||
                !recipientAccountNumber ||
                !recipientBankCode ||
                createPayout.isPending
              }
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPayout.isPending ? "Submitting..." : "Create Payout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
