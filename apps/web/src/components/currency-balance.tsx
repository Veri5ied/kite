import type { WalletBalance } from "../services/dashboard/types";

const currencyFlags: Record<WalletBalance["currency"], string> = {
  USD: "🇺🇸",
  GBP: "🇬🇧",
  EUR: "🇪🇺",
  NGN: "🇳🇬",
  KES: "🇰🇪",
};

export default function CurrencyBalances({
  balances,
}: {
  balances: WalletBalance[];
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold mb-4">Your Balances</h3>
      <div className="space-y-2">
        {balances.map((balance) => (
          <div key={balance.currency} className="currency-balance">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg leading-none">
                {currencyFlags[balance.currency]}
              </span>
              <div className="font-display font-medium text-sm">
                {balance.currency}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-semibold text-sm">
                {balance.amount}
              </div>
              <div className="text-[11px] text-neutral-500 font-body">
                ≈ ${Number(balance.usdEquivalentMinor) / 100}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
