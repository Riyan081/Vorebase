/**
 * Vorebase Query Compiler — Filter Operators
 *
 * Maps Supabase-compatible URL query operators to SQL equivalents.
 *
 * Usage in URLs:
 *   ?status=eq.active       → WHERE status = 'active'
 *   ?age=gt.18              → WHERE age > 18
 *   ?name=like.*john*       → WHERE name LIKE '%john%'
 *   ?id=in.(1,2,3)          → WHERE id IN (1, 2, 3)
 *   ?deleted_at=is.null     → WHERE deleted_at IS NULL
 */

import type { FilterOperator } from "@repo/common";

export interface OperatorMapping {
  sql: string;
  /** Whether the operator takes a list of values (e.g., IN) */
  isList: boolean;
  /** Whether the operator uses IS instead of = (e.g., IS NULL) */
  isNullOp: boolean;
  /** Whether to transform wildcards (* → %) */
  isLike: boolean;
}

export const OPERATOR_MAP: Record<FilterOperator, OperatorMapping> = {
  eq: { sql: "=", isList: false, isNullOp: false, isLike: false },
  neq: { sql: "!=", isList: false, isNullOp: false, isLike: false },
  gt: { sql: ">", isList: false, isNullOp: false, isLike: false },
  gte: { sql: ">=", isList: false, isNullOp: false, isLike: false },
  lt: { sql: "<", isList: false, isNullOp: false, isLike: false },
  lte: { sql: "<=", isList: false, isNullOp: false, isLike: false },
  like: { sql: "LIKE", isList: false, isNullOp: false, isLike: true },
  ilike: { sql: "LIKE", isList: false, isNullOp: false, isLike: true },
  in: { sql: "IN", isList: true, isNullOp: false, isLike: false },
  is: { sql: "IS", isList: false, isNullOp: true, isLike: false },
};

/**
 * Validates that an operator string is a known filter operator.
 */
export function isValidOperator(op: string): op is FilterOperator {
  return op in OPERATOR_MAP;
}

/**
 * Transforms Supabase-style wildcards to SQL LIKE wildcards.
 * '*' → '%' for LIKE/ILIKE operators.
 */
export function transformLikeValue(value: string): string {
  return value.replace(/\*/g, "%");
}

/**
 * Parse an IN value: "(1,2,3)" → ["1", "2", "3"]
 */
export function parseInValues(raw: string): string[] {
  // Remove surrounding parentheses
  const inner = raw.replace(/^\(/, "").replace(/\)$/, "");
  if (!inner) return [];
  return inner.split(",").map((v) => v.trim());
}
