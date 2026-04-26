import { QuickConvert } from "../components";

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight mb-2">
          Convert Balances
        </h2>
        <p className="text-sm text-neutral-600 font-body">
          Create a live FX quote, review the spread and expiry, then execute the conversion against your wallet balance.
        </p>
      </div>
      <QuickConvert />
    </div>
  );
}
