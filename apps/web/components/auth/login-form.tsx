"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VorebaseLogo } from "@/lib/icons";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsLoading(true);
    // Mock: any email/password succeeds
    await new Promise((r) => setTimeout(r, 800));
    router.push("/projects");
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <VorebaseLogo size={32} />
        <span className="text-xl font-bold text-text-primary tracking-tight">Vorebase</span>
      </div>

      <h1 className="text-2xl font-bold text-text-primary text-center mb-1">Welcome back</h1>
      <p className="text-sm text-text-secondary text-center mb-6">Sign in to your account</p>

      {/* OAuth Buttons */}
      <OAuthButtons />

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">or continue with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

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
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
              Password
            </label>
            <a href="#" className="text-xs text-accent hover:text-accent-hover transition-colors">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
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
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">
          Sign up
        </Link>
      </p>

      {/* Demo hint */}
      <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-border">
        <p className="text-xs text-text-muted text-center">
          <span className="font-medium text-text-secondary">Demo:</span> Any email &amp; password works
        </p>
      </div>
    </div>
  );
}
