"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLoading from "@/components/AuthLoading";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth state and redirect if authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/user');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          // Redirect authenticated users to studio
          router.push('/studio');
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('[Auth] Error checking auth state:', err);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <AuthLoading />;
  }

  // If authenticated, the redirect will happen, but show loading just in case
  if (isAuthenticated) {
    return <AuthLoading message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-zinc-900 mb-6">
            Marcus · Your AI PM for Content & Marketing
          </h1>
          <p className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
            Answer 5 questions, get a weekly content & client workflow tailored to your real life.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-lg"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3 bg-white text-zinc-900 font-medium rounded-lg border-2 border-zinc-300 hover:bg-zinc-50 transition-colors text-lg"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                Tell Marcus About You
              </h3>
              <p className="text-zinc-600">
                Tell Marcus what you do, where you post, and how much time you really have.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                Get Your Workflow
              </h3>
              <p className="text-zinc-600">
                Marcus designs a weekly workflow for your clients, content, or launch.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                Run & Iterate
              </h3>
              <p className="text-zinc-600">
                You run the system, adjust with Marcus, and keep iterating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-12">
            Who It's For
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Freelance Content Creators
              </h3>
              <p className="text-sm text-zinc-600">
                Build a sustainable system that fits your schedule and helps you land clients.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Social Media Managers
              </h3>
              <p className="text-sm text-zinc-600">
                Streamline client work with workflows that scale across platforms.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Small Agency Owners
              </h3>
              <p className="text-sm text-zinc-600">
                Organize your team's content production and client delivery.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Solo Creators
              </h3>
              <p className="text-sm text-zinc-600">
                Get organized and grow your audience without burning out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Friends Beta */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">
              Friends Beta
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl mx-auto">
              This is a private beta. You need an access code to use Marcus.
            </p>
            <Link
              href="/login?next=/studio"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Have an access code? Open Marcus →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-zinc-900 text-zinc-400">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm">
            © 2024 Marcus · Built for content creators and marketers
          </p>
        </div>
      </footer>
    </div>
  );
}
