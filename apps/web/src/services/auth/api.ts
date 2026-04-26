import { api } from "../../lib/api";
import type {
  AuthResponse,
  AuthSession,
  SignInInput,
  SignUpInput,
} from "./types";

export async function signIn(input: SignInInput) {
  const response = await api.post<AuthResponse>("/auth/signin", input);

  return response.data;
}

export async function signUp(input: SignUpInput) {
  const response = await api.post<AuthResponse>("/auth/signup", input);

  return response.data;
}

export async function getMe() {
  const response = await api.get<AuthSession>("/auth/me");

  return response.data;
}
