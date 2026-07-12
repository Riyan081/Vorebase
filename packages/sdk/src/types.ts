/**
 * @vorebase/js — Shared Types
 *
 * All public types exposed by the SDK.
 */

// ── Auth Types ───────────────────────────────────────────

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  created_at?: string;
  last_sign_in_at?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthResponse {
  user: UserInfo;
  session: AuthSession;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

// ── Query Types ──────────────────────────────────────────

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "in"
  | "is";

export interface QueryResult<T = Record<string, unknown>> {
  data: T[] | null;
  count: number | null;
  error: VorebaseError | null;
  status: number;
}

export interface MutationResult {
  data: { message: string; affected_rows: number; insert_id?: number | null } | null;
  error: VorebaseError | null;
  status: number;
}

// ── Storage Types ────────────────────────────────────────

export interface UploadResult {
  path: string;
  bucket: string;
  mime_type: string;
  size: number;
}

export interface FileObject {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface SignedUrlResult {
  signed_url: string;
  path: string;
  bucket: string;
  expires_in: number;
  expires_at: string;
}

// ── Realtime Types ───────────────────────────────────────

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface RealtimePayload<T = Record<string, unknown>> {
  new: T | null;
  old: T | null;
}

export type RealtimeCallback<T = Record<string, unknown>> = (
  payload: RealtimePayload<T>
) => void;

export interface RealtimeMessage {
  type: string;
  channel?: string;
  event?: string;
  payload?: RealtimePayload;
  message?: string;
  client_id?: string;
}

// ── Error Types ──────────────────────────────────────────

export interface VorebaseError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

// ── Client Options ───────────────────────────────────────

export interface VorebaseClientOptions {
  /**
   * Custom headers to send with every request.
   */
  headers?: Record<string, string>;
  /**
   * Auto-refresh access tokens when they expire.
   * @default true
   */
  autoRefreshToken?: boolean;
}
