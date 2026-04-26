import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import {
  useCreateQuote,
  useExecuteQuote,
  useWalletBalances,
} from "../services/dashboard/hooks";
import type { SupportedCurrency } from "../services/dashboard/types";

export default function QuickConvert() {
  const balancesQuery = useWalletBalances();
  const balances = balancesQuery.data?.balances ?? [];
  const currencyOptions = balances.map((balance) => balance.currency);

  const [sourceAmount, setSourceAmount] = useState("1000.00");
  const [sourceCurrency, setSourceCurrency] =
    useState<SupportedCurrency>("USD");
  const [targetCurrency, setTargetCurrency] =
    useState<SupportedCurrency>("EUR");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);

  const createQuote = useCreateQuote();
  const executeQuote = useExecuteQuote(() => {
    setActiveQuoteId(null);
    setSecondsRemaining(0);
  });

  const quote = createQuote.data?.quote;

  useEffect(() => {
    if (!quote?.expiresAt || activeQuoteId !== quote.id) {
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
    };

    tick();

    const interval = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeQuoteId, quote?.expiresAt, quote?.id]);

  const sourceBalance = useMemo(
    () => balances.find((balance) => balance.currency === sourceCurrency),
    [balances, sourceCurrency],
  );

  const targetBalance = useMemo(
    () => balances.find((balance) => balance.currency === targetCurrency),
    [balances, targetCurrency],
  );

  const hasActiveQuote =
    quote &&
    activeQuoteId === quote.id &&
    secondsRemaining > 0 &&
    quote.sourceCurrency === sourceCurrency &&
    quote.targetCurrency === targetCurrency &&
    quote.sourceAmountMinor === toMinorString(sourceAmount);

  function toMinorString(amount: string) {
    if (!amount) {
      return "0";
    }

    const [wholePart, fractionalPart = ""] = amount.split(".");
    const normalizedFraction = fractionalPart.padEnd(2, "0").slice(0, 2);

    return `${wholePart}${normalizedFraction}`.replace(/^0+(?=\d)/, "") || "0";
  }

  function formatMinor(minor: string) {
    const amount = Number(minor) / 100;

    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function handleGetQuote() {
    const response = await createQuote.mutateAsync({
      sourceCurrency,
      targetCurrency,
      amount: sourceAmount,
    });

    setActiveQuoteId(response.quote.id);
  }

  async function handleExecuteQuote() {
    if (!quote || !hasActiveQuote) {
      return;
    }

    await executeQuote.mutateAsync({
      quoteId: quote.id,
    });
  }

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
              onChange={(e) =>
                setSourceCurrency(e.target.value as SupportedCurrency)
              }
              className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              {currencyOptions.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
            <input
              type="number"
              value={sourceAmount}
              onChange={(e) => setSourceAmount(e.target.value)}
              min="0"
              step="0.01"
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
              onChange={(e) =>
                setTargetCurrency(e.target.value as SupportedCurrency)
              }
              className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-white font-body text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              {currencyOptions
                .filter((currency) => currency !== sourceCurrency)
                .map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
            </select>
            <div className="flex-1 px-3 py-2.5 border border-neutral-200 rounded bg-neutral-50 font-body text-sm flex items-center">
              <span className="text-neutral-600">
                {quote?.targetCurrency === targetCurrency
                  ? formatMinor(quote.targetAmountMinor)
                  : (targetBalance?.amount ?? "0.00")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-neutral-500 font-body">
          <div>
            Quote valid for{" "}
            <span className="font-medium">
              {hasActiveQuote ? `${secondsRemaining}s` : "60 seconds"}
            </span>
          </div>
          <div className="text-right">
            Rate:{" "}
            <span className="font-medium">
              {quote?.quotedRate ? Number(quote.quotedRate).toFixed(4) : "—"}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="text-xs text-neutral-500 font-body space-y-1">
            <div>
              Available {sourceCurrency}:{" "}
              <span className="font-medium text-neutral-700">
                {sourceBalance?.amount ?? "0.00"}
              </span>
            </div>
            {quote ? (
              <>
                <div>
                  Base rate:{" "}
                  <span className="font-medium text-neutral-700">
                    {Number(quote.baseRate).toFixed(4)}
                  </span>
                </div>
                <div>
                  Spread:{" "}
                  <span className="font-medium text-neutral-700">
                    {(quote.spreadBps / 100).toFixed(2)}%
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleGetQuote}
            disabled={
              createQuote.isPending ||
              !sourceAmount ||
              sourceCurrency === targetCurrency
            }
            className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createQuote.isPending ? "Getting Quote..." : "Get Quote"}
          </button>

          <button
            type="button"
            onClick={handleExecuteQuote}
            disabled={!hasActiveQuote || executeQuote.isPending}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executeQuote.isPending ? "Executing..." : "Execute Conversion"}
          </button>
        </div>
      </div>
    </div>
  );
}
