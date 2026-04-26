export type SupportedCurrency = "USD" | "GBP" | "EUR" | "NGN" | "KES";

export type AuthAccount = {
  id: string;
  currency: SupportedCurrency;
  code: string;
  type: string;
};

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthWallet = {
  id: string;
  createdAt: string;
} | null;

export type AuthSession = {
  user: AuthUser;
  wallet: AuthWallet;
  accounts: AuthAccount[];
};

export type AuthResponse = AuthSession & {
  accessToken: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = SignInInput;
