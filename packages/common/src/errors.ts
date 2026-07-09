/**
 * Vorebase — Standardized Error Classes
 *
 * All services throw these errors. The Fastify error handler
 * catches them and returns the correct HTTP status + message.
 *
 * SECURITY: Error messages sent to clients are generic.
 * Detailed info is logged server-side only.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: string | null;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details: string | null = null
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  /**
   * Returns the error as a safe JSON response (no stack traces).
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        details: this.details,
        hint: null,
      },
      status: this.statusCode,
    };
  }
}

// ==========================================
// Auth Errors
// ==========================================

export class AuthError extends AppError {
  constructor(message: string = "Invalid credentials") {
    // Always 401 — don't reveal whether email or password is wrong
    super(message, 401, "AUTH_ERROR");
    this.name = "AuthError";
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super("Token has expired", 401, "TOKEN_EXPIRED");
    this.name = "TokenExpiredError";
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super("Invalid or malformed token", 401, "TOKEN_INVALID");
    this.name = "TokenInvalidError";
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "INSUFFICIENT_PERMISSIONS");
    this.name = "InsufficientPermissionsError";
  }
}

// ==========================================
// Resource Errors
// ==========================================

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

// ==========================================
// Validation Errors
// ==========================================

export class ValidationError extends AppError {
  constructor(message: string, details: string | null = null) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

// ==========================================
// Rate Limiting
// ==========================================

export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests. Please try again later.", 429, "RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

// ==========================================
// RLS Errors
// ==========================================

export class RlsViolationError extends AppError {
  constructor() {
    // Don't reveal which policy was violated — just deny access
    super("Row level security policy violation", 403, "RLS_VIOLATION");
    this.name = "RlsViolationError";
  }
}
