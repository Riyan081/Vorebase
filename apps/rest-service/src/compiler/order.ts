/**
 * Vorebase Query Compiler — ORDER BY Compiler
 *
 * Parses the `?order=` query parameter into SQL ORDER BY clause.
 *
 * Examples:
 *   ?order=created_at.desc        → ORDER BY `created_at` DESC
 *   ?order=name.asc,id.desc      → ORDER BY `name` ASC, `id` DESC
 *   ?order=email                  → ORDER BY `email` ASC (default)
 *   (no order param)              → "" (no ORDER BY)
 */

import type { ParsedOrder } from "@repo/common";
import { escapeIdentifier } from "../utils/sanitize.js";

export interface CompiledOrder {
  /** SQL ORDER BY clause (without "ORDER BY" keyword) or empty string */
  sql: string;
  /** Parsed order entries */
  orders: ParsedOrder[];
}

/**
 * Parse the `order` query parameter into SQL.
 *
 * @param orderParam - The raw `?order=` value (e.g., "created_at.desc,name.asc")
 * @returns Compiled order clause
 */
export function compileOrder(orderParam?: string): CompiledOrder {
  if (!orderParam || orderParam.trim() === "") {
    return { sql: "", orders: [] };
  }

  const parts = orderParam.split(",").map((p) => p.trim()).filter(Boolean);
  const orders: ParsedOrder[] = [];
  const sqlParts: string[] = [];

  for (const part of parts) {
    const dotIndex = part.indexOf(".");
    let column: string;
    let direction: "asc" | "desc" = "asc";

    if (dotIndex === -1) {
      // No direction specified → default ASC
      column = part;
    } else {
      column = part.substring(0, dotIndex);
      const dir = part.substring(dotIndex + 1).toLowerCase();
      if (dir === "desc") {
        direction = "desc";
      }
    }

    const escapedColumn = escapeIdentifier(column);
    sqlParts.push(`${escapedColumn} ${direction.toUpperCase()}`);
    orders.push({ column, direction });
  }

  return {
    sql: sqlParts.join(", "),
    orders,
  };
}
