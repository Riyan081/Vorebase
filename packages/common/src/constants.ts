/**
 * Vorebase — Shared Constants
 *
 * Centralized configuration values used across all services.
 * Change these in one place, and all services pick them up.
 */

// ==========================================
// Service Ports
// ==========================================
export const PORTS = {
  AUTH_SERVICE: Number(process.env.AUTH_SERVICE_PORT) || 4001,
  REST_SERVICE: Number(process.env.REST_SERVICE_PORT) || 4002,
  STORAGE_SERVICE: Number(process.env.STORAGE_SERVICE_PORT) || 4003,
  WS_SERVICE: Number(process.env.WS_SERVICE_PORT) || 4004,
  STUDIO: Number(process.env.STUDIO_PORT) || 3000,
} as const;

// ==========================================
// JWT Configuration
// ==========================================
export const JWT = {
  /** Access token lifetime — keep short for security */
  ACCESS_TOKEN_EXPIRY: "15m",
  /** Refresh token lifetime — longer, but one-time use */
  REFRESH_TOKEN_EXPIRY: "7d",
  /** Refresh token expiry in milliseconds (for DB storage) */
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
  /** Minimum JWT secret length */
  MIN_SECRET_LENGTH: 32,
} as const;

// ==========================================
// Password / Security
// ==========================================
export const SECURITY = {
  /** bcrypt salt rounds — 12 is a good balance of security and speed */
  BCRYPT_SALT_ROUNDS: 12,
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum password length (prevent DoS via bcrypt) */
  MAX_PASSWORD_LENGTH: 128,
  /** API key length in bytes (32 bytes = 64 hex chars) */
  API_KEY_LENGTH: 32,
  /** API key prefix for identification */
  API_KEY_PREFIX_ANON: "vb_anon_",
  API_KEY_PREFIX_SERVICE: "vb_service_",
} as const;

// ==========================================
// Roles
// ==========================================
export const ROLES = {
  /** Platform admin roles */
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
  /** Project-level user roles */
  AUTHENTICATED: "authenticated",
  ANON: "anon",
  SERVICE_ROLE: "service_role",
} as const;

// ==========================================
// Rate Limiting
// ==========================================
export const RATE_LIMITS = {
  /** Auth endpoints: max requests per minute per IP */
  AUTH_MAX_PER_MINUTE: 5,
  /** General API: max requests per minute per IP */
  API_MAX_PER_MINUTE: 60,
} as const;

// ==========================================
// Storage
// ==========================================
export const STORAGE = {
  /** Default max file size: 50MB */
  DEFAULT_MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** Signed URL expiry: 1 hour */
  SIGNED_URL_EXPIRY_SECONDS: 3600,
} as const;

// ==========================================
// System tables — these are NEVER exposed via the REST API
// ==========================================
export const SYSTEM_TABLES = [
  "AdminUser",
  "Project",
  "ApiKey",
  "User",
  "RefreshToken",
  "StorageBucket",
  "StorageObject",
  "RlsPolicy",
  "ChangeEvent",
  "_prisma_migrations",
] as const;
