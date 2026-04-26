import { useState } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";

export default function Page() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    console.log({ email, password, isSignUp });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-semibold mb-2">Kite</h1>
          <p className="text-neutral-600 font-body">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
              <AlertCircle className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-display font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kite.com"
                className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-display font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="*******"
                className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          <button type="submit" className="w-full btn-primary mt-6">
            {isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600 font-body">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setEmail("");
                setPassword("");
              }}
              className="font-display font-medium text-black hover:opacity-80 transition-opacity"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
