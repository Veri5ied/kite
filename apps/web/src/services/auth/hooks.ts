import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { getErrorMessage } from "../../lib/http";
import { AUTH, DASHBOARD } from "../../routes";
import {
  authKeys,
  meQueryOptions,
  signInMutationOptions,
  signUpMutationOptions,
} from "./queries";
import { clearAccessToken, getAccessToken, setAccessToken } from "./storage";
import type {
  AuthResponse,
  AuthSession,
  SignInInput,
  SignUpInput,
} from "./types";

function toSession(data: AuthResponse): AuthSession {
  return {
    user: data.user,
    wallet: data.wallet,
    accounts: data.accounts,
  };
}

export function clearAuthSession() {
  clearAccessToken();
}

export function useAuthSession() {
  const token = getAccessToken();
  const queryClient = useQueryClient();
  const query = useQuery(meQueryOptions(Boolean(token)));

  useEffect(() => {
    if (!token || !query.isError) {
      return;
    }

    clearAuthSession();
    queryClient.removeQueries({ queryKey: authKeys.me() });
  }, [query.isError, queryClient, token]);

  return {
    token,
    ...query,
    isAuthenticated: Boolean(token) && query.isSuccess,
  };
}

export function useSignIn() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...signInMutationOptions(),
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(authKeys.me(), toSession(data));
      await navigate(DASHBOARD, { replace: true });
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...signUpMutationOptions(),
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(authKeys.me(), toSession(data));
      await navigate(DASHBOARD, { replace: true });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    clearAuthSession();
    queryClient.clear();
    toast.success("Signed out successfully");
    void navigate(AUTH, { replace: true });
  };
}

export async function runAuthFlow(
  action: (input: SignInInput | SignUpInput) => Promise<AuthResponse>,
  input: SignInInput | SignUpInput,
  mode: "signin" | "signup",
) {
  return toast.promise(action(input), {
    loading:
      mode === "signup" ? "Creating your account..." : "Signing you in...",
    success:
      mode === "signup"
        ? "Account created successfully"
        : "Signed in successfully",
    error: (error) => getErrorMessage(error),
  });
}
