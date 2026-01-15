/**
 * Auth utility functions with proper error handling
 */

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthCheckResult {
  authenticated: boolean;
  user: AuthUser | null;
  error: string | null;
}

/**
 * Check authentication status with retry logic
 */
export async function checkAuth(retries = 2): Promise<AuthCheckResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('/api/auth/user', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        // Non-2xx response
        if (res.status === 401) {
          return {
            authenticated: false,
            user: null,
            error: null, // Not authenticated is not an error
          };
        }

        throw new Error(`Auth check failed with status ${res.status}`);
      }

      const data = await res.json();

      return {
        authenticated: data.authenticated || false,
        user: data.user || null,
        error: null,
      };
    } catch (err) {
      lastError = err as Error;

      // If this isn't the last retry, wait before trying again
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  // All retries failed
  return {
    authenticated: false,
    user: null,
    error: lastError?.message || 'Failed to verify authentication',
  };
}

/**
 * Require authentication or redirect to login
 */
export async function requireAuth(nextUrl?: string): Promise<AuthUser> {
  const result = await checkAuth();

  if (result.error) {
    // Network error or API failure
    throw new Error(result.error);
  }

  if (!result.authenticated || !result.user) {
    // Not authenticated - redirect to login
    const loginUrl = nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : '/login';
    window.location.href = loginUrl;
    throw new Error('Not authenticated'); // Throw to stop execution
  }

  return result.user;
}
