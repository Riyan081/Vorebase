/**
 * Vorebase REST API — SQL Sanitization Utilities
 *
 * Prevents SQL injection for identifiers (table names, column names).
 * Values are always parameterized (never string-interpolated).
 *
 * SECURITY:
 * - Table/column names are backtick-escaped AND whitelist-validated
 * - Only alphanumeric + underscore allowed in identifiers
 * - System tables are blocked from being accessed via REST API
 */

import { SYSTEM_TABLES } from "@repo/common";

/**
 * Validate and escape a MySQL identifier (table or column name).
 * Wraps in backticks and validates characters.
 *
 * SECURITY: This is a defense-in-depth measure. Even though we
 * validate with a whitelist, the backtick escaping adds another layer.
 *
 * @throws Error if identifier contains invalid characters
 */
export function escapeIdentifier(name: string): string {
  // Strip any existing backticks
  const cleaned = name.replace(/`/g, "");

  // Whitelist: only allow alphanumeric and underscore
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleaned)) {
    throw new Error(
      `Invalid identifier: "${name}". Only letters, numbers, and underscores are allowed.`
    );
  }

  // Max length check (MySQL max identifier is 64 chars)
  if (cleaned.length > 64) {
    throw new Error(
      `Identifier too long: "${name}". Maximum 64 characters.`
    );
  }

  return `\`${cleaned}\``;
}

/**
 * Check if a table name is a system table that should not be
 * accessible via the public REST API.
 */
export function isSystemTable(tableName: string): boolean {
  const lower = tableName.toLowerCase();
  return SYSTEM_TABLES.some((t) => t.toLowerCase() === lower);
}

/**
 * Validate that a table name is safe to use in the REST API.
 * @throws Error if the table is a system table or invalid
 */
export function validateTableAccess(tableName: string): void {
  if (isSystemTable(tableName)) {
    throw new Error(
      `Access denied: "${tableName}" is a system table and cannot be accessed via the REST API.`
    );
  }

  // Also validate it's a valid identifier
  escapeIdentifier(tableName);
}
