/**
 * Vorebase — Shared TypeScript Types
 *
 * Interfaces and types used across all backend services.
 */

// ==========================================
// API Response Types
// ==========================================

/** Standard success response */
export interface ApiResponse<T = unknown> {
  data: T;
  count?: number;
  status: number;
}

/** Standard error response */
export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details: string | null;
    hint: string | null;
  };
  status: number;
}

// ==========================================
// JWT Types
// ==========================================

/** JWT payload for project-level user tokens */
export interface JwtPayload {
  /** User ID (uuid) */
  sub: string;
  /** User email */
  email: string;
  /** User role: "authenticated" | "anon" | "service_role" */
  role: string;
  /** Project ID this token is scoped to */
  project_id: string;
  /** Issued at (unix timestamp) */
  iat: number;
  /** Expires at (unix timestamp) */
  exp: number;
}

/** JWT payload for platform admin tokens */
export interface AdminJwtPayload {
  /** Admin user ID */
  sub: string;
  /** Admin email */
  email: string;
  /** Admin role: "admin" | "super_admin" */
  role: string;
  /** Issued at */
  iat: number;
  /** Expires at */
  exp: number;
}

// ==========================================
// Auth Types
// ==========================================

export interface SignupRequest {
  email: string;
  password: string;
  projectId?: string;
}

export interface SigninRequest {
  email: string;
  password: string;
  projectId?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
}

// ==========================================
// Query Compiler Types
// ==========================================

/** Supported filter operators */
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

/** A parsed filter from URL query params */
export interface ParsedFilter {
  column: string;
  operator: FilterOperator;
  value: string | string[] | null;
}

/** A parsed order from URL query params */
export interface ParsedOrder {
  column: string;
  direction: "asc" | "desc";
}

/** Compiled query ready for execution */
export interface CompiledQuery {
  sql: string;
  params: unknown[];
}

// ==========================================
// RLS Types
// ==========================================

/** A virtual RLS policy check expression */
export interface RlsPolicyCheck {
  column: string;
  op: FilterOperator;
  /** "auth.uid()" gets replaced with the JWT sub at evaluation time */
  value: string;
}

// ==========================================
// Storage Types
// ==========================================

export interface BucketInfo {
  id: string;
  name: string;
  isPublic: boolean;
  fileSizeLimit: number | null;
  allowedMimeTypes: string[] | null;
}

export interface FileInfo {
  id: string;
  name: string;
  bucketId: string;
  mimeType: string | null;
  size: number | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Realtime Types
// ==========================================

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimePayload {
  type: "postgres_changes";
  channel: string;
  event: RealtimeEvent;
  payload: {
    new: Record<string, unknown> | null;
    old: Record<string, unknown> | null;
  };
}

export interface SubscriptionMessage {
  type: "subscribe" | "unsubscribe";
  channel: string;
  event?: RealtimeEvent | "*";
  filter?: string;
}

// ==========================================
// Database Column Introspection
// ==========================================

export interface ColumnInfo {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  nullable: boolean;
  defaultValue: string | null;
  autoIncrement: boolean;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}
