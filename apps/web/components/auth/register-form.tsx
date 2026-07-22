"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VorebaseLogo } from "@/lib/icons";
import PasswordStrengthBar from "@/components/auth/password-strength";
import { adminRegister } from "@/lib/api";
import { setToken, setRefreshToken, setAdminUser, isAuthenticated, getToken } from "@/lib/auth";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    // Don't auto-redirect — a logged-in admin may want to create another admin
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      // Pass the existing admin token if logged in (allows creating more admins)
      const existingToken = getToken();
      const res = await adminRegister(email, password, existingToken ?? undefined);

      // If a new session was returned (first admin / self-registration), store it
      if (res.data.access_token && !isLoggedIn) {
        setToken(res.data.access_token);
        if (res.data.refresh_token) setRefreshToken(res.data.refresh_token);
        setAdminUser(res.data.user);
        router.push("/projects");
      } else {
        // Logged-in admin created another admin — show success
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        alert(`Admin account created for ${res.data.user.email}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <VorebaseLogo size={32} />
        <span className="text-xl font-bold text-text-primary tracking-tight">Vorebase</span>
      </div>

      <h1 className="text-2xl font-bold text-text-primary text-center mb-1">
        {isLoggedIn ? "Create Admin Account" : "Create an account"}
      </h1>
      <p className="text-sm text-text-secondary text-center mb-6">
        {isLoggedIn
          ? "You are logged in — create a new admin user below."
          : "Get started with Vorebase Studio"}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
          />
          <PasswordStrengthBar password={password} />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-text-secondary mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={`w-full px-3 py-2.5 rounded-lg bg-bg-input border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
              confirmPassword && password !== confirmPassword
                ? "border-danger focus:ring-danger/50"
                : "border-border focus:ring-accent/50 focus:border-accent"
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-bg-primary font-semibold text-sm transition-all duration-150 hover:shadow-glow"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
