/**
 * Vorebase Studio — Frontend Auth / Session Management
 *
 * Stores admin JWT + refresh token in localStorage. Provides helpers for
 * login state, token access, auto-refresh, and auto-redirect on 401.
 */

const TOKEN_KEY = "vorebase_admin_token";
const REFRESH_TOKEN_KEY = "vorebase_admin_refresh_token";
const ADMIN_KEY = "vorebase_admin_user";

// ── Token Storage ────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── Admin User Info ──────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setAdminUser(user: AdminUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
}

// ── Auth Headers ─────────────────────────────────────────

export function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ── Token Refresh ────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the admin access token using the stored refresh token.
 * Returns true if refresh succeeded, false otherwise.
 * De-dupes concurrent refresh attempts.
 */
export async function refreshAdminToken(): Promise<boolean> {
  // De-dupe: if already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/auth/v1/admin/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearToken();
        return false;
      }

      const body = await res.json();
      const data = body.data;

      if (data?.access_token) {
        setToken(data.access_token);
      }
      if (data?.refresh_token) {
        setRefreshToken(data.refresh_token);
      }

      return true;
    } catch {
      clearToken();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Redirect on Unauthorized ─────────────────────────────

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearToken();
  window.location.href = "/login";
}

/**
 * Handle API response — if 401, try to refresh token first.
 * If refresh fails, redirect to login.
 * Returns the response for further processing.
 */
export async function handleAuthResponse(res: Response): Promise<Response> {
  if (res.status === 401) {
    // Try refreshing the token before giving up
    const refreshed = await refreshAdminToken();
    if (refreshed) {
      // Token refreshed — caller should retry the request
      throw new Error("TOKEN_REFRESHED");
    }
    redirectToLogin();
    throw new Error("Session expired. Redirecting to login.");
  }
  return res;
}
