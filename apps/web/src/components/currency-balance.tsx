const currencyFlags = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  NGN: "🇳🇬",
  KES: "🇰🇪",
} as const;

type Currency = keyof typeof currencyFlags;

type balancesProps = {
  currency: Currency;
  amount: number;
}[];

export default function CurrencyBalances({
  balances,
}: {
  balances: balancesProps;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold mb-4">Your Balances</h3>
      <div className="space-y-2">
        {balances.map((balance) => (
          <div key={balance.currency} className="currency-balance">
            <div className="flex items-center gap-3">
              <span className="text-lg">{currencyFlags[balance.currency]}</span>
              <div className="font-display font-medium text-sm">
                {balance.currency}
              </div>
            </div>
            <div className="font-display font-semibold text-sm">
              {balance.amount.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
