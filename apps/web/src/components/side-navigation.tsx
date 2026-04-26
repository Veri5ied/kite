import { LogOut } from "lucide-react";
import { NavLink } from "react-router";
import { CONVERT, DASHBOARD, TRANSACTIONS } from "../routes";

function Sidenavigation() {
  return (
    <div className="w-64 border-r border-neutral-200 flex flex-col bg-white">
      <div className="px-6 py-6.5 border-neutral-200">
        <div className="font-display text-xl font-bold tracking-tight">
          Kite
        </div>
      </div>
      <nav className="flex-1 pt-6 px-2 space-y-1">
        <NavLink
          to={DASHBOARD}
          end
          className={({ isActive }) =>
            `sidebar-link group flex items-center gap-3 w-full ${
              isActive ? "active" : "text-neutral-600 hover:text-black"
            }`
          }
        >
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to={TRANSACTIONS}
          className={({ isActive }) =>
            `sidebar-link group flex items-center gap-3 w-full ${
              isActive ? "active" : "text-neutral-600 hover:text-black"
            }`
          }
        >
          <span>Transactions</span>
        </NavLink>
        <NavLink
          to={CONVERT}
          className={({ isActive }) =>
            `sidebar-link group flex items-center gap-3 w-full ${
              isActive ? "active" : "text-neutral-600 hover:text-black"
            }`
          }
        >
          <span>Convert</span>
        </NavLink>
      </nav>

      <div className="px-6 py-6 border-t border-neutral-200 space-y-4">
        <button
          onClick={() => {}}
          className="w-full flex items-center justify-start gap-2 px-4 py-2.5 text-sm text-neutral-600 hover:text-black transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Sidenavigation;
