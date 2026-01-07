"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLoading from "@/components/AuthLoading";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if already authenticated and redirect to studio
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/user');
        const data = await res.json();
        if (data.authenticated && data.user) {
          // Already authenticated, redirect to studio
          router.push('/studio');
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error('[Auth] Error checking auth state:', err);
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Safely parse JSON response
      let data;
      try {
        const rawText = await res.text();
        if (!rawText) {
          throw new Error("Empty response from server");
        }
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error("[Signup] Failed to parse response:", parseError);
        throw new Error("Invalid response from server. Please try again.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      // Show success message briefly before redirect
      if (data.success) {
        // Redirect to studio after successful signup
        setTimeout(() => {
          router.push("/studio");
          router.refresh();
        }, 500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setError(errorMessage);
      setLoading(false);
      console.error("[Signup] Error:", err);
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return <AuthLoading />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Sign Up</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-zinc-200 px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded border border-zinc-200 px-3 py-2 text-sm"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-zinc-500">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}