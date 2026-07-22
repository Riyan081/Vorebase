/**
 * Vorebase Studio — API Client
 *
 * Comprehensive HTTP client that wraps all backend service calls.
 * Uses the Next.js proxy rewrites (next.config.js) so all calls
 * go to the same origin — no CORS issues in development.
 *
 * Auth service   →  /auth/v1/...
 * REST service   →  /rest/v1/...
 * Storage service → /storage/v1/...
 */

import { authHeaders, handleAuthResponse } from "./auth";

// ── Types ────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  db_name: string;
  created_at: string;
  updated_at?: string;
  counts?: {
    users: number;
    buckets: number;
    api_keys?: number;
    rls_policies?: number;
  };
  api_keys?: ApiKeyInfo[];
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  autoIncrement: boolean;
}

export interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
  columns: TableColumn[];
}

export interface TableRow {
  [key: string]: string | number | boolean | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
  lastSignInAt?: string | null;
  last_sign_in_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface RlsPolicy {
  id: string;
  name: string;
  tableName: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  roles: string[];
  check: unknown;
  isEnabled: boolean;
  createdAt: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  is_public: boolean;
  file_size_limit?: number | null;
  allowed_mime_types?: string[] | null;
  created_at: string;
  updated_at?: string;
  object_count?: number;
}

export interface StorageFile {
  id: string;
  name: string;
  bucketId?: string;
  mimeType: string;
  size: number;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  role: string;
  key_prefix: string;
  created_at: string;
}

export interface ApiKeyCreateResult extends ApiKeyInfo {
  api_key: string;
  project_id: string;
  warning: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  service: string;
  message: string;
}

export interface SqlQueryResult {
  data: Record<string, unknown>[];
  count?: number;
  status: number;
}

// ── Generic Fetch Helper ─────────────────────────────────

interface ApiResponse<T> {
  data: T;
  count?: number;
  status: number;
  page?: number;
  limit?: number;
  total_pages?: number;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type if we actually have a body to send (Fastify rejects empty bodies with application/json)
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  await handleAuthResponse(res);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error?.message || body.message || (typeof body.error === 'string' ? body.error : null) || `API Error: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────

export async function adminLogin(email: string, password: string) {
  const res = await fetch("/auth/v1/admin/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || body.message || "Invalid email or password");
  }

  return res.json() as Promise<
    ApiResponse<{
      user: { id: string; email: string; role: string };
      access_token: string;
      refresh_token?: string;
      token_type: string;
    }>
  >;
}

export async function adminRegister(email: string, password: string, existingToken?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (existingToken) {
    headers["Authorization"] = `Bearer ${existingToken}`;
  }
  const res = await fetch("/auth/v1/admin/signup", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error?.message || body.message || "Unable to create account"
    );
  }

  return res.json() as Promise<
    ApiResponse<{
      user: { id: string; email: string; role: string; created_at: string };
      access_token: string;
      refresh_token?: string;
      token_type: string;
    }>
  >;
}

// ── Projects ─────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  const res = await apiFetch<Project[]>("/auth/v1/admin/projects");
  return res.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await apiFetch<Project>(`/auth/v1/admin/projects/${id}`);
  return res.data;
}

export async function createProject(
  name: string,
  description?: string
): Promise<Project> {
  const res = await apiFetch<Project>("/auth/v1/admin/projects", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
  return res.data;
}

export async function updateProject(
  id: string,
  data: { name?: string; description?: string }
): Promise<Project> {
  const res = await apiFetch<Project>(`/auth/v1/admin/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await apiFetch(`/auth/v1/admin/projects/${id}`, { method: "DELETE" });
}

// ── Schema / Tables ──────────────────────────────────────

export async function getSchema(projectId: string): Promise<TableInfo[]> {
  const res = await apiFetch<TableInfo[]>("/rest/v1/schema", {
    headers: { "x-project-id": projectId },
  });
  return res.data;
}

export async function getTableNames(projectId: string): Promise<string[]> {
  const res = await apiFetch<string[]>("/rest/v1/schema/tables", {
    headers: { "x-project-id": projectId },
  });
  return res.data;
}

export async function getTableColumns(
  projectId: string,
  table: string
): Promise<{ table: string; columns: TableColumn[] }> {
  const res = await apiFetch<{ table: string; columns: TableColumn[] }>(
    `/rest/v1/schema/tables/${encodeURIComponent(table)}`,
    { headers: { "x-project-id": projectId } }
  );
  return res.data;
}

// ── Table DDL (Schema Management) ────────────────────────

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: string | null;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
}

export async function createTable(
  projectId: string,
  tableName: string,
  columns: ColumnDefinition[]
): Promise<{ message: string; table: string; columns: number }> {
  const res = await apiFetch<{ message: string; table: string; columns: number }>(
    "/rest/v1/schema/tables",
    {
      method: "POST",
      headers: { "x-project-id": projectId },
      body: JSON.stringify({ name: tableName, columns }),
    }
  );
  return res.data;
}

export async function dropTable(
  projectId: string,
  tableName: string
): Promise<void> {
  await apiFetch(
    `/rest/v1/schema/tables/${encodeURIComponent(tableName)}`,
    {
      method: "DELETE",
      headers: { "x-project-id": projectId },
    }
  );
}

export async function addColumn(
  projectId: string,
  tableName: string,
  column: ColumnDefinition
): Promise<{ message: string; table: string; column: string; type: string }> {
  const res = await apiFetch<{ message: string; table: string; column: string; type: string }>(
    `/rest/v1/schema/tables/${encodeURIComponent(tableName)}/columns`,
    {
      method: "POST",
      headers: { "x-project-id": projectId },
      body: JSON.stringify(column),
    }
  );
  return res.data;
}

export async function dropColumn(
  projectId: string,
  tableName: string,
  columnName: string
): Promise<void> {
  await apiFetch(
    `/rest/v1/schema/tables/${encodeURIComponent(tableName)}/columns/${encodeURIComponent(columnName)}`,
    {
      method: "DELETE",
      headers: { "x-project-id": projectId },
    }
  );
}

// ── Table CRUD ───────────────────────────────────────────

export async function getTableRows(
  projectId: string,
  table: string,
  params?: Record<string, string>
): Promise<{ data: TableRow[]; count: number }> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await apiFetch<TableRow[]>(
    `/rest/v1/${encodeURIComponent(table)}${query}`,
    { headers: { "x-project-id": projectId } }
  );
  return { data: res.data, count: res.count ?? res.data.length };
}

export async function insertRow(
  projectId: string,
  table: string,
  row: Record<string, unknown>
): Promise<{ affected_rows: number; insert_id: number | null }> {
  const res = await apiFetch<{
    message: string;
    affected_rows: number;
    insert_id: number | null;
  }>(`/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { "x-project-id": projectId },
    body: JSON.stringify(row),
  });
  return res.data;
}

export async function updateRow(
  projectId: string,
  table: string,
  filters: Record<string, string>,
  row: Record<string, unknown>
): Promise<{ affected_rows: number }> {
  const query = "?" + new URLSearchParams(filters).toString();
  const res = await apiFetch<{ message: string; affected_rows: number }>(
    `/rest/v1/${encodeURIComponent(table)}${query}`,
    {
      method: "PATCH",
      headers: { "x-project-id": projectId },
      body: JSON.stringify(row),
    }
  );
  return res.data;
}

export async function deleteRows(
  projectId: string,
  table: string,
  filters: Record<string, string>
): Promise<{ affected_rows: number }> {
  const query = "?" + new URLSearchParams(filters).toString();
  const res = await apiFetch<{ message: string; affected_rows: number }>(
    `/rest/v1/${encodeURIComponent(table)}${query}`,
    {
      method: "DELETE",
      headers: { "x-project-id": projectId },
    }
  );
  return res.data;
}

// ── SQL Editor ───────────────────────────────────────────

export async function executeSQL(
  projectId: string,
  sql: string
): Promise<SqlQueryResult> {
  // Use the dedicated raw SQL endpoint
  const res = await apiFetch<Record<string, unknown>[]>(
    "/rest/v1/sql",
    {
      method: "POST",
      headers: { "x-project-id": projectId },
      body: JSON.stringify({ query: sql }),
    }
  );
  return { data: res.data as Record<string, unknown>[], count: res.count, status: res.status };
}

// ── Auth Users (Admin) ───────────────────────────────────

export async function listAuthUsers(
  projectId: string,
  page = 1,
  limit = 50
): Promise<{
  data: AuthUser[];
  count: number;
  page: number;
  total_pages: number;
}> {
  const res = await apiFetch<AuthUser[]>(
    `/auth/v1/admin/users?projectId=${projectId}&page=${page}&limit=${limit}`
  );
  return {
    data: res.data,
    count: res.count ?? res.data.length,
    page: res.page ?? page,
    total_pages: res.total_pages ?? 1,
  };
}

export async function createAuthUser(
  projectId: string,
  email: string,
  password: string,
  role = "authenticated"
): Promise<AuthUser> {
  const res = await apiFetch<AuthUser>("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, projectId, role }),
  });
  return res.data;
}

export async function deleteAuthUser(userId: string): Promise<void> {
  await apiFetch(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
}

export async function updateAuthUser(
  userId: string,
  data: {
    email?: string;
    password?: string;
    role?: string;
    metadata?: Record<string, unknown>;
    appMetadata?: Record<string, unknown>;
  }
): Promise<AuthUser> {
  const res = await apiFetch<AuthUser>(`/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

// ── RLS Policies ─────────────────────────────────────────

export async function listPolicies(projectId: string): Promise<RlsPolicy[]> {
  const res = await apiFetch<RlsPolicy[]>(
    `/rest/v1/rls/policies?projectId=${projectId}`,
    { headers: { "x-project-id": projectId } }
  );
  return res.data;
}

export async function createPolicy(policy: {
  name: string;
  tableName: string;
  operation: string;
  check: { column: string; op: string; value: string };
  roles?: string[];
  projectId: string;
}): Promise<RlsPolicy> {
  const res = await apiFetch<RlsPolicy>("/rest/v1/rls/policies", {
    method: "POST",
    headers: { "x-project-id": policy.projectId },
    body: JSON.stringify(policy),
  });
  return res.data;
}

export async function updatePolicy(
  id: string,
  projectId: string,
  data: Partial<{
    name: string;
    tableName: string;
    operation: string;
    check: { column: string; op: string; value: string };
    roles: string[];
  }>
): Promise<RlsPolicy> {
  const res = await apiFetch<RlsPolicy>(`/rest/v1/rls/policies/${id}`, {
    method: "PUT",
    headers: { "x-project-id": projectId },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deletePolicy(id: string, projectId: string): Promise<void> {
  await apiFetch(`/rest/v1/rls/policies/${id}`, {
    method: "DELETE",
    headers: { "x-project-id": projectId },
  });
}

export async function togglePolicy(id: string, projectId: string): Promise<RlsPolicy> {
  const res = await apiFetch<RlsPolicy>(
    `/rest/v1/rls/policies/${id}/toggle`,
    { method: "PATCH", headers: { "x-project-id": projectId } }
  );
  return res.data;
}

// ── Storage Buckets ──────────────────────────────────────

export async function listBuckets(
  projectId: string
): Promise<StorageBucket[]> {
  const res = await apiFetch<StorageBucket[]>(
    `/storage/v1/bucket?projectId=${projectId}`
  );
  return res.data;
}

export async function createBucket(data: {
  name: string;
  projectId: string;
  isPublic?: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
}): Promise<StorageBucket> {
  const res = await apiFetch<StorageBucket>("/storage/v1/bucket", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteBucket(id: string): Promise<void> {
  await apiFetch(`/storage/v1/bucket/${id}`, { method: "DELETE" });
}

// ── Storage Objects ──────────────────────────────────────

export async function listObjects(
  projectId: string,
  bucketName: string,
  prefix = "",
  limit = 100,
  offset = 0
): Promise<{ data: StorageFile[]; count: number }> {
  const res = await apiFetch<StorageFile[]>(
    `/storage/v1/object/list/${encodeURIComponent(bucketName)}`,
    {
      method: "POST",
      headers: { "x-project-id": projectId },
      body: JSON.stringify({ prefix, limit, offset }),
    }
  );
  return { data: res.data, count: res.count ?? res.data.length };
}

export async function uploadFile(
  projectId: string,
  bucketName: string,
  filePath: string,
  file: File
): Promise<{ path: string; bucket: string; mime_type: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch<{
    path: string;
    bucket: string;
    mime_type: string;
    size: number;
  }>(`/storage/v1/object/${encodeURIComponent(bucketName)}/${filePath}`, {
    method: "POST",
    headers: { "x-project-id": projectId },
    body: formData,
  });
  return res.data;
}

export async function deleteFile(
  projectId: string,
  bucketName: string,
  filePath: string
): Promise<void> {
  await apiFetch(
    `/storage/v1/object/${encodeURIComponent(bucketName)}/${filePath}`,
    {
      method: "DELETE",
      headers: { "x-project-id": projectId },
    }
  );
}

export async function getSignedUrl(
  projectId: string,
  bucketName: string,
  filePath: string,
  expiresIn = 3600
): Promise<{ signed_url: string; expires_at: string }> {
  const res = await apiFetch<{
    signed_url: string;
    path: string;
    bucket: string;
    expires_in: number;
    expires_at: string;
  }>(`/storage/v1/object/sign/${encodeURIComponent(bucketName)}/${filePath}`, {
    method: "POST",
    headers: { "x-project-id": projectId },
    body: JSON.stringify({ expiresIn }),
  });
  return res.data;
}

// ── API Keys ─────────────────────────────────────────────

export async function listApiKeys(
  projectId: string
): Promise<ApiKeyInfo[]> {
  const res = await apiFetch<ApiKeyInfo[]>(
    `/auth/v1/admin/keys?projectId=${projectId}`
  );
  return res.data;
}

export async function createApiKey(
  name: string,
  projectId: string
): Promise<ApiKeyCreateResult> {
  const res = await apiFetch<ApiKeyCreateResult>("/auth/v1/admin/keys", {
    method: "POST",
    body: JSON.stringify({ name, projectId }),
  });
  return res.data;
}

export async function deleteApiKey(id: string): Promise<void> {
  await apiFetch(`/auth/v1/admin/keys/${id}`, { method: "DELETE" });
}
