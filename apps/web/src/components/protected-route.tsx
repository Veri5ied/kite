import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { AUTH } from "../routes";
import { useAuthSession } from "../services/auth/hooks";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, isPending, isError } = useAuthSession();

  if (!token) {
    return <Navigate to={AUTH} replace />;
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-neutral-500">
        Loading your workspace...
      </div>
    );
  }

  if (isError) {
    return <Navigate to={AUTH} replace />;
  }

  return <>{children}</>;
}
