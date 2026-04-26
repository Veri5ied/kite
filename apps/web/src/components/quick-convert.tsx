import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

export default function QuickConvert() {
  const [sourceAmount, setSourceAmount] = useState("1000");
  const [sourceCurrency, setSourceCurrency] = useState("USD");
  const [targetCurrency, setTargetCurrency] = useState("EUR");

  const fxRates = {
    "USD-EUR": 0.92,
    "USD-GBP": 0.79,
    "USD-NGN": 1234.5,
    "USD-KES": 136.5,
    "EUR-USD": 1.087,
    "EUR-GBP": 0.86,
    "EUR-NGN": 1341.5,
    "EUR-KES": 148.3,
    "GBP-USD": 1.266,
    "GBP-EUR": 1.163,
    "GBP-NGN": 1560.0,
    "GBP-KES": 172.4,
    "NGN-USD": 0.00081,
    "NGN-EUR": 0.00075,
    "NGN-GBP": 0.00064,
    "NGN-KES": 0.111,
    "KES-USD": 0.00733,
    "KES-EUR": 0.0067,
    "KES-GBP": 0.0058,
    "KES-NGN": 9.01,
  };

  const getRate = (fromCurrency: string, toCurrency: string) => {
    const rateKey = `${fromCurrency}-${toCurrency}` as keyof typeof fxRates;
    return fxRates[rateKey] ?? 1;
  };

  const getConvertedAmount = () => {
    const rate = getRate(sourceCurrency, targetCurrency);
    return (parseFloat(sourceAmount || "0") * rate).toFixed(2);
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-6">
      <h3 className="font-display text-lg font-semibold mb-6">Quick Convert</h3>

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-neutral-500 font-body mb-2">
            From
          </label>
          <div className="flex gap-3">
            <select
              value={sourceCurrency}
              onChange={(e) => setSourceCurrency(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>NGN</option>
              <option>KES</option>
            </select>
            <input
              type="number"
              value={sourceAmount}
              onChange={(e) => setSourceAmount(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Amount"
            />
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <div className="w-8 h-8 rounded border border-neutral-200 flex items-center justify-center bg-neutral-50">
            <ArrowRightLeft className="w-4 h-4 text-neutral-600" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 font-body mb-2">
            To
          </label>
          <div className="flex gap-3">
            <select
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>NGN</option>
              <option>KES</option>
            </select>
            <div className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-neutral-50 font-body text-sm flex items-center">
              <span className="text-neutral-600">{getConvertedAmount()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-neutral-500 font-body">
          <div>
            Quote valid for <span className="font-medium">30 seconds</span>
          </div>
          <div className="text-right">
            Rate:{" "}
            <span className="font-medium">
              {getRate(sourceCurrency, targetCurrency).toFixed(4)}
            </span>
          </div>
        </div>

        <button className="w-full btn-primary mt-4">Execute Conversion</button>
      </div>
    </div>
  );
}
