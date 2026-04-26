import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { DASHBOARD } from "../routes";
import { useAuthSession } from "../services/auth/hooks";

export default function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { token, isPending, isAuthenticated } = useAuthSession();

  if (!token) {
    return <>{children}</>;
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-neutral-500">
        Checking your session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={DASHBOARD} replace />;
  }

  return <>{children}</>;
}
