/**
 * Vorebase — @repo/common barrel export
 *
 * Import everything from "@repo/common":
 *   import { signAccessToken, hashPassword, AppError, PORTS } from "@repo/common"
 */

// Constants
export {
  PORTS,
  JWT,
  SECURITY,
  ROLES,
  RATE_LIMITS,
  STORAGE,
  SYSTEM_TABLES,
} from "./constants.js";

// Environment validation
export { validateEnv, getEnv, EnvError } from "./env.js";

// Error classes
export {
  AppError,
  AuthError,
  TokenExpiredError,
  TokenInvalidError,
  InsufficientPermissionsError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  RlsViolationError,
} from "./errors.js";

// JWT helpers
export {
  signAccessToken,
  signAdminAccessToken,
  signRefreshToken,
  verifyToken,
  decodeToken,
  extractBearerToken,
} from "./jwt.js";

// Logger
export { createLogger } from "./logger.js";
export type { Logger } from "./logger.js";

// Security utilities
export {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateApiKey,
  hashApiKey,
  timingSafeCompare,
  sanitizeIdentifier,
} from "./security.js";

// Types
export type {
  ApiResponse,
  ApiErrorResponse,
  JwtPayload,
  AdminJwtPayload,
  SignupRequest,
  SigninRequest,
  AuthTokens,
  FilterOperator,
  ParsedFilter,
  ParsedOrder,
  CompiledQuery,
  RlsPolicyCheck,
  BucketInfo,
  FileInfo,
  RealtimeEvent,
  RealtimePayload,
  SubscriptionMessage,
  ColumnInfo,
  TableInfo,
} from "./types.js";
