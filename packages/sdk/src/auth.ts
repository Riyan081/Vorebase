/**
 * @vorebase/js — Auth Client
 *
 * Handles user authentication: signup, signin, signout,
 * token storage, and automatic token refresh.
 *
 * Usage:
 *   const { data, error } = await vb.auth.signUp({ email, password })
 *   const { data, error } = await vb.auth.signIn({ email, password })
 *   await vb.auth.signOut()
 *   const user = vb.auth.getUser()
 */

import type { HttpClient } from "./http.js";
import type {
  SignUpCredentials,
  SignInCredentials,
  AuthResponse,
  AuthSession,
  UserInfo,
  VorebaseError,
} from "./types.js";

interface AuthResult<T> {
  data: T | null;
  error: VorebaseError | null;
}

export class AuthClient {
  private http: HttpClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentUser: UserInfo | null = null;
  private projectId: string;
  private autoRefresh: boolean;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /** Callbacks registered via onAuthStateChange */
  private listeners: Array<(event: string, session: AuthSession | null) => void> = [];

  constructor(http: HttpClient, projectId: string, autoRefresh: boolean) {
    this.http = http;
    this.projectId = projectId;
    this.autoRefresh = autoRefresh;
  }

  /**
   * Get the current access token (used internally by HttpClient).
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Sign up a new user with email and password.
   */
  async signUp(
    credentials: SignUpCredentials
  ): Promise<AuthResult<AuthResponse>> {
    const res = await this.http.rawFetch("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        projectId: this.projectId,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error: {
          message: body.error?.message || body.message || "Sign up failed",
          code: body.error?.code || "AUTH_ERROR",
          details: null,
          hint: null,
        },
      };
    }

    const authData = body.data as AuthResponse;
    this.setSession(authData.session, authData.user);

    return { data: authData, error: null };
  }

  /**
   * Sign in with email and password.
   */
  async signIn(
    credentials: SignInCredentials
  ): Promise<AuthResult<AuthResponse>> {
    const res = await this.http.rawFetch("/auth/v1/signin", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        projectId: this.projectId,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error: {
          message: body.error?.message || body.message || "Sign in failed",
          code: body.error?.code || "AUTH_ERROR",
          details: null,
          hint: null,
        },
      };
    }

    const authData = body.data as AuthResponse;
    this.setSession(authData.session, authData.user);

    return { data: authData, error: null };
  }

  /**
   * Sign out — revokes all refresh tokens.
   */
  async signOut(): Promise<AuthResult<null>> {
    try {
      await this.http.rawFetch("/auth/v1/signout", { method: "POST" });
    } catch {
      // Best-effort signout
    }

    this.clearSession();
    return { data: null, error: null };
  }

  /**
   * Get the currently authenticated user info.
   */
  async getUser(): Promise<AuthResult<UserInfo>> {
    if (!this.accessToken) {
      return {
        data: null,
        error: {
          message: "Not authenticated",
          code: "NOT_AUTHENTICATED",
          details: null,
          hint: "Call signIn() first",
        },
      };
    }

    const res = await this.http.fetch<UserInfo>("/auth/v1/user");
    if (res.error) {
      return { data: null, error: res.error };
    }

    this.currentUser = res.data;
    return { data: res.data, error: null };
  }

  /**
   * Get the current session (access + refresh tokens).
   */
  getSession(): AuthSession | null {
    if (!this.accessToken || !this.refreshToken) return null;
    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      token_type: "bearer",
      expires_in: 0,
      expires_at: 0,
    };
  }

  /**
   * Manually refresh the access token using the stored refresh token.
   */
  async refreshSession(): Promise<AuthResult<AuthSession>> {
    if (!this.refreshToken) {
      return {
        data: null,
        error: {
          message: "No refresh token available",
          code: "NO_REFRESH_TOKEN",
          details: null,
          hint: "Call signIn() first",
        },
      };
    }

    const res = await this.http.rawFetch("/auth/v1/token/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      this.clearSession();
      return {
        data: null,
        error: {
          message: body.error?.message || "Token refresh failed",
          code: body.error?.code || "REFRESH_ERROR",
          details: null,
          hint: null,
        },
      };
    }

    const session = body.data.session as AuthSession;
    this.accessToken = session.access_token;
    this.refreshToken = session.refresh_token;
    this.scheduleRefresh(session.expires_in);
    this.notifyListeners("TOKEN_REFRESHED", session);

    return { data: session, error: null };
  }

  /**
   * Listen for auth state changes.
   */
  onAuthStateChange(
    callback: (event: string, session: AuthSession | null) => void
  ): { unsubscribe: () => void } {
    this.listeners.push(callback);
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter((l) => l !== callback);
      },
    };
  }

  // ── Internal Helpers ──────────────────────────────────

  private setSession(session: AuthSession, user: UserInfo): void {
    this.accessToken = session.access_token;
    this.refreshToken = session.refresh_token;
    this.currentUser = user;

    if (this.autoRefresh) {
      this.scheduleRefresh(session.expires_in);
    }

    this.notifyListeners("SIGNED_IN", session);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.notifyListeners("SIGNED_OUT", null);
  }

  private scheduleRefresh(expiresInSeconds: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh 60 seconds before expiry
    const refreshIn = Math.max((expiresInSeconds - 60) * 1000, 5000);
    this.refreshTimer = setTimeout(() => {
      this.refreshSession().catch(() => {
        // Silent fail — user will need to re-authenticate
      });
    }, refreshIn);
  }

  private notifyListeners(event: string, session: AuthSession | null): void {
    for (const listener of this.listeners) {
      try {
        listener(event, session);
      } catch {
        // Don't let listener errors break the auth flow
      }
    }
  }
}
