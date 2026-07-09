/**
 * Vorebase Query Compiler — LIMIT/OFFSET Pagination
 *
 * Parses `?limit=` and `?offset=` query parameters.
 *
 * Examples:
 *   ?limit=10&offset=20  → LIMIT 10 OFFSET 20
 *   ?limit=50            → LIMIT 50
 *   (no params)          → LIMIT 1000 (safety cap)
 *
 * SECURITY: Max limit is capped at 1000 to prevent DoS via huge result sets.
 */

export interface CompiledPagination {
  /** SQL LIMIT/OFFSET clause */
  sql: string;
  /** Actual limit value used */
  limit: number;
  /** Actual offset value used */
  offset: number;
}

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 1000;

/**
 * Parse limit and offset query parameters.
 *
 * @param limitParam - The raw `?limit=` value
 * @param offsetParam - The raw `?offset=` value
 * @returns Compiled pagination clause
 */
export function compilePagination(
  limitParam?: string,
  offsetParam?: string
): CompiledPagination {
  let limit = DEFAULT_LIMIT;
  let offset = 0;

  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }

  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  let sql = `LIMIT ${limit}`;
  if (offset > 0) {
    sql += ` OFFSET ${offset}`;
  }

  return { sql, limit, offset };
}
