import { useLocation } from "react-router";
import { CONVERT, DASHBOARD, TRANSACTIONS } from "../routes";

function Topnavigation() {
  const location = useLocation();
  const title =
    location.pathname === DASHBOARD
      ? "Dashboard"
      : location.pathname === TRANSACTIONS
        ? "Transactions"
        : location.pathname === CONVERT
          ? "Convert"
          : "Kite";

  return (
    <div className="border-b border-neutral-200 px-8 py-6 bg-white flex items-center justify-between">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
    </div>
  );
}

export default Topnavigation;
