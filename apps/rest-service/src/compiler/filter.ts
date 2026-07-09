/**
 * Vorebase Query Compiler — WHERE Clause Filter Compiler
 *
 * Parses Supabase-style URL query filters into parameterized SQL WHERE clauses.
 *
 * Examples:
 *   ?status=eq.active&age=gt.18
 *     → WHERE `status` = ? AND `age` > ?
 *     → params: ["active", 18]
 *
 *   ?id=in.(1,2,3)
 *     → WHERE `id` IN (?, ?, ?)
 *     → params: [1, 2, 3]
 *
 *   ?deleted_at=is.null
 *     → WHERE `deleted_at` IS NULL
 *     → params: []
 *
 * SECURITY: All values go through parameterized queries — never interpolated.
 */

import type { ParsedFilter } from "@repo/common";
import {
  OPERATOR_MAP,
  isValidOperator,
  transformLikeValue,
  parseInValues,
} from "./operators.js";
import { escapeIdentifier } from "../utils/sanitize.js";

export interface CompiledFilter {
  /** SQL WHERE clause (without the "WHERE" keyword) or empty string */
  sql: string;
  /** Parameterized values */
  params: unknown[];
  /** Parsed filters for debugging/logging */
  filters: ParsedFilter[];
}

/** Query param keys that are NOT column filters */
const RESERVED_PARAMS = new Set([
  "select",
  "order",
  "limit",
  "offset",
  "on_conflict",
]);

/**
 * Parse URL query parameters into a compiled WHERE clause.
 *
 * @param query - The full query string object from Fastify request
 * @returns Compiled filter with SQL and params
 */
export function compileFilters(
  query: Record<string, string | undefined>
): CompiledFilter {
  const filters: ParsedFilter[] = [];
  const conditions: string[] = [];
  const params: unknown[] = [];

  for (const [key, rawValue] of Object.entries(query)) {
    // Skip reserved params and empty values
    if (RESERVED_PARAMS.has(key) || !rawValue) continue;

    // Parse operator: "eq.active" → operator="eq", value="active"
    const dotIndex = rawValue.indexOf(".");
    if (dotIndex === -1) continue; // Not a valid filter format

    const operatorStr = rawValue.substring(0, dotIndex);
    const valueStr = rawValue.substring(dotIndex + 1);

    if (!isValidOperator(operatorStr)) continue;

    const opMapping = OPERATOR_MAP[operatorStr];
    const column = escapeIdentifier(key);

    // Handle IS NULL / IS NOT NULL
    if (opMapping.isNullOp) {
      if (valueStr === "null") {
        conditions.push(`${column} IS NULL`);
        filters.push({ column: key, operator: operatorStr, value: null });
      } else if (valueStr === "true") {
        conditions.push(`${column} IS TRUE`);
        filters.push({ column: key, operator: operatorStr, value: "true" });
      } else if (valueStr === "false") {
        conditions.push(`${column} IS FALSE`);
        filters.push({ column: key, operator: operatorStr, value: "false" });
      }
      continue;
    }

    // Handle IN operator: "(1,2,3)"
    if (opMapping.isList) {
      const values = parseInValues(valueStr);
      if (values.length === 0) continue;

      const placeholders = values.map(() => "?").join(", ");
      conditions.push(`${column} IN (${placeholders})`);
      params.push(...values);
      filters.push({ column: key, operator: operatorStr, value: values });
      continue;
    }

    // Handle LIKE/ILIKE: transform wildcards
    if (opMapping.isLike) {
      const likeValue = transformLikeValue(valueStr);
      // For ILIKE (case-insensitive), use LOWER() in MySQL
      if (operatorStr === "ilike") {
        conditions.push(`LOWER(${column}) LIKE LOWER(?)`);
      } else {
        conditions.push(`${column} LIKE ?`);
      }
      params.push(likeValue);
      filters.push({ column: key, operator: operatorStr, value: valueStr });
      continue;
    }

    // Standard comparison operators (eq, neq, gt, gte, lt, lte)
    conditions.push(`${column} ${opMapping.sql} ?`);
    params.push(valueStr);
    filters.push({ column: key, operator: operatorStr, value: valueStr });
  }

  return {
    sql: conditions.length > 0 ? conditions.join(" AND ") : "",
    params,
    filters,
  };
}
