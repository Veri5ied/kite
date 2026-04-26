import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { getMe, signIn, signUp } from "./api";
import type { SignInInput, SignUpInput } from "./types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  signIn: () => [...authKeys.all, "sign-in"] as const,
  signUp: () => [...authKeys.all, "sign-up"] as const,
};

export function meQueryOptions(isEnabled: boolean) {
  return queryOptions({
    queryKey: authKeys.me(),
    queryFn: getMe,
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function signInMutationOptions() {
  return mutationOptions({
    mutationKey: authKeys.signIn(),
    mutationFn: (input: SignInInput) => signIn(input),
  });
}

export function signUpMutationOptions() {
  return mutationOptions({
    mutationKey: authKeys.signUp(),
    mutationFn: (input: SignUpInput) => signUp(input),
  });
}
