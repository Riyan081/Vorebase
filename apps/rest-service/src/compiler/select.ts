/**
 * Vorebase Query Compiler — SELECT Column Parser
 *
 * Parses the `?select=` query parameter into a list of columns.
 *
 * Examples:
 *   ?select=id,name,email       → ["id", "name", "email"]
 *   ?select=*                   → ["*"] (all columns)
 *   (no select param)           → ["*"] (default: all columns)
 *
 * NOTE: Supabase supports embedded resources like `author:users(name)`.
 * We don't support JOINs in v1 — only flat column selection.
 */

import { escapeIdentifier } from "../utils/sanitize.js";

export interface ParsedSelect {
  /** SQL column list string, e.g., "`id`, `name`, `email`" */
  sql: string;
  /** Raw column names (for validation) */
  columns: string[];
  /** Whether selecting all columns */
  isSelectAll: boolean;
}

/**
 * Parse the `select` query parameter.
 *
 * @param selectParam - The raw `?select=` value (e.g., "id,name,email")
 * @returns Parsed select info
 */
export function parseSelect(selectParam?: string): ParsedSelect {
  // No select param or "*" → select all
  if (!selectParam || selectParam.trim() === "*" || selectParam.trim() === "") {
    return {
      sql: "*",
      columns: ["*"],
      isSelectAll: true,
    };
  }

  // Split by comma and clean up
  const columns = selectParam
    .split(",")
    .map((col) => col.trim())
    .filter((col) => col.length > 0);

  if (columns.length === 0) {
    return {
      sql: "*",
      columns: ["*"],
      isSelectAll: true,
    };
  }

  // Escape each column name as a MySQL identifier
  const escapedColumns = columns.map((col) => escapeIdentifier(col));

  return {
    sql: escapedColumns.join(", "),
    columns,
    isSelectAll: false,
  };
}
