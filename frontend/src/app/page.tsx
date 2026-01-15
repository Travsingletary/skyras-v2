"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLoading from "@/components/AuthLoading";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth state and redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/user');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          // Redirect authenticated users to library
          router.push('/library');
        } else {
          setIsAuthenticated(false);
          // Redirect unauthenticated users to signup
          router.push('/signup');
        }
      } catch (err) {
        console.error('[Auth] Error checking auth state:', err);
        setIsAuthenticated(false);
        router.push('/signup');
      }
    };
    
    checkAuth();
  }, [router]);

  // Show loading state while checking auth and redirecting
  return <AuthLoading message="Redirecting..." />;
}
