/**
 * Vorebase — Security Utilities
 *
 * Password hashing (bcrypt), API key generation and hashing,
 * and input sanitization.
 *
 * SECURITY:
 * - Passwords: bcrypt with 12 rounds (constant-time comparison built in)
 * - API keys: crypto.randomBytes → stored as SHA-256 hash (never plaintext)
 * - Timing-safe comparison for token verification
 */

import bcrypt from "bcrypt";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { SECURITY } from "./constants.js";

// ==========================================
// Password Hashing (bcrypt)
// ==========================================

/**
 * Hash a password with bcrypt.
 * Uses 12 salt rounds for a good security/performance balance.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * Uses constant-time comparison (built into bcrypt).
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength.
 * Returns null if valid, error message if invalid.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < SECURITY.MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${SECURITY.MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > SECURITY.MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${SECURITY.MAX_PASSWORD_LENGTH} characters`;
  }
  return null;
}

// ==========================================
// API Key Generation & Hashing
// ==========================================

/**
 * Generate a cryptographically random API key.
 *
 * @param prefix - Key prefix (e.g., "vb_anon_" or "vb_service_")
 * @returns Object with the raw key (show once to user) and hash (store in DB)
 */
export function generateApiKey(prefix: string): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const rawBytes = randomBytes(SECURITY.API_KEY_LENGTH);
  const rawKey = prefix + rawBytes.toString("base64url");
  const keyHash = hashApiKey(rawKey);
  // Store first 8 chars for identification in UI
  const keyPrefix = rawKey.substring(0, prefix.length + 8);

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hash an API key with SHA-256 for secure storage.
 * We NEVER store the raw API key — only the hash.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

// ==========================================
// Timing-Safe Comparison
// ==========================================

/**
 * Constant-time string comparison to prevent timing attacks.
 * Use this for comparing tokens, API keys, etc.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to maintain constant time
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(a); // compare with self to maintain timing
    timingSafeEqual(bufA, bufB);
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ==========================================
// Input Sanitization
// ==========================================

/**
 * Sanitize a string to prevent common injection attacks.
 * Use this for user-provided identifiers (not for SQL — use parameterized queries for that).
 */
export function sanitizeIdentifier(input: string): string {
  // Only allow alphanumeric, underscore, and hyphen
  return input.replace(/[^a-zA-Z0-9_-]/g, "");
}
