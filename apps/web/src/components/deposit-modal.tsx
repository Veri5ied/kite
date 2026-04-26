import { useState } from "react";
import { X } from "lucide-react";
import { type ModalProps } from "../lib/utils";

export default function DepositModal({ onClose }: ModalProps) {
  const [depositMethod, setDepositMethod] = useState("bank");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");

  const methods = [
    { id: "bank", label: "Bank Transfer", desc: "Free, 1-3 business days" },
    { id: "card", label: "Debit Card", desc: "Instant, 1-2% fee" },
    { id: "ach", label: "ACH", desc: "Free, 2-3 business days" },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle deposit logic
    console.log({ method: depositMethod, amount, currency });
    onClose();
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
                className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
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

          <div>
            <label className="block text-sm font-display font-medium mb-3">
              Deposit Method
            </label>
            <div className="space-y-2">
              {methods.map((method) => (
                <label
                  key={method.id}
                  className="flex items-start gap-3 p-3 border border-neutral-200 rounded cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="method"
                    value={method.id}
                    checked={depositMethod === method.id}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-display font-medium text-sm">
                      {method.label}
                    </div>
                    <div className="text-xs text-neutral-500 font-body">
                      {method.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
            <p className="text-xs text-neutral-600 font-body">
              <strong>Processing Time:</strong> Varies by method. You'll receive
              a confirmation email once your deposit is received.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
