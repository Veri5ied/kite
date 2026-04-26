import { Outlet } from "react-router";
import { SideNavigation, TopNavigation } from "./components";

export default function Layout() {
  return (
    <div className="flex h-screen bg-white">
      <SideNavigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation />
        <div className="flex-1 overflow-auto">
          <div className="px-8 py-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
