/**
 * Vorebase — JWT Helpers
 *
 * Sign, verify, and decode JSON Web Tokens.
 *
 * SECURITY:
 * - Access tokens: 15 min expiry (short-lived)
 * - Refresh tokens: 7 days (one-time use, rotated on refresh)
 * - Enforces minimum secret length
 * - Never catches verification errors silently
 */

import jwt from "jsonwebtoken";
import { JWT } from "./constants.js";
import { TokenExpiredError, TokenInvalidError } from "./errors.js";
import type { JwtPayload, AdminJwtPayload } from "./types.js";

/**
 * Sign a JWT access token for a project-level user.
 */
export function signAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string
): string {
  assertSecretStrength(secret);
  return jwt.sign(payload, secret, {
    expiresIn: JWT.ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Sign a JWT access token for a platform admin.
 */
export function signAdminAccessToken(
  payload: Omit<AdminJwtPayload, "iat" | "exp">,
  secret: string
): string {
  assertSecretStrength(secret);
  return jwt.sign(payload, secret, {
    expiresIn: JWT.ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Sign a JWT refresh token (longer-lived, one-time use).
 */
export function signRefreshToken(
  payload: { sub: string; type: "refresh" },
  secret: string
): string {
  assertSecretStrength(secret);
  return jwt.sign(payload, secret, {
    expiresIn: JWT.REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify and decode a JWT token.
 * Throws TokenExpiredError or TokenInvalidError on failure.
 */
export function verifyToken<T extends JwtPayload | AdminJwtPayload>(
  token: string,
  secret: string
): T {
  try {
    return jwt.verify(token, secret) as T;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    }
    throw new TokenInvalidError();
  }
}

/**
 * Decode a JWT without verification.
 * Use only when you need to read the payload without checking signature
 * (e.g., to extract the project_id before looking up the secret).
 *
 * SECURITY: NEVER trust the output of this for authorization decisions.
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === "string") {
    return null;
  }
  return decoded as JwtPayload;
}

/**
 * Extract the Bearer token from an Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] || null;
}

// ==========================================
// Internal Helpers
// ==========================================

function assertSecretStrength(secret: string): void {
  if (secret.length < JWT.MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT secret must be at least ${JWT.MIN_SECRET_LENGTH} characters. ` +
        `Got ${secret.length}. Please use a stronger secret.`
    );
  }
}
