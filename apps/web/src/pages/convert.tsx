import { QuickConvert } from "../components";

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-neutral-600 font-body">
          Real-time currency conversion with live FX rates
        </p>
      </div>
      <QuickConvert />
    </div>
  );
}
