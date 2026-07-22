/**
 * Vorebase Query Compiler — Main Pipeline
 *
 * Orchestrates the full URL → SQL compilation pipeline:
 *   1. Parse SELECT columns
 *   2. Parse WHERE filters
 *   3. Parse ORDER BY
 *   4. Parse LIMIT/OFFSET
 *   5. Compose final parameterized SQL
 *
 * This is the single entry point for all query compilation.
 */

import type { CompiledQuery } from "@repo/common";
import { parseSelect } from "./select.js";
import { compileFilters } from "./filter.js";
import { compileOrder } from "./order.js";
import { compilePagination } from "./pagination.js";
import { escapeIdentifier } from "../utils/sanitize.js";

export interface CompileOptions {
  /** Table name */
  table: string;
  /** Full query string object from Fastify request */
  query: Record<string, string | undefined>;
  /** Additional WHERE conditions to inject (from RLS) */
  rlsConditions?: { sql: string; params: unknown[] };
}

export interface CompileSelectResult extends CompiledQuery {
  /** Metadata about the compiled query */
  meta: {
    table: string;
    columns: string[];
    filterCount: number;
    limit: number;
    offset: number;
  };
}

/**
 * Compile a SELECT query from URL query parameters.
 */
export function compileSelectQuery(options: CompileOptions): CompileSelectResult {
  const { table, query, rlsConditions } = options;
  const escapedTable = escapeIdentifier(table);

  // 1. SELECT columns
  const select = parseSelect(query.select);

  // 2. WHERE filters
  const filters = compileFilters(query);

  // 3. Merge RLS conditions with user filters
  const allConditions: string[] = [];
  const allParams: unknown[] = [];

  if (rlsConditions && rlsConditions.sql) {
    allConditions.push(`(${rlsConditions.sql})`);
    allParams.push(...rlsConditions.params);
  }

  if (filters.sql) {
    allConditions.push(`(${filters.sql})`);
    allParams.push(...filters.params);
  }

  const whereClause =
    allConditions.length > 0
      ? `WHERE ${allConditions.join(" AND ")}`
      : "";

  // 4. ORDER BY
  const order = compileOrder(query.order);
  const orderClause = order.sql ? `ORDER BY ${order.sql}` : "";

  // 5. LIMIT/OFFSET
  const pagination = compilePagination(query.limit, query.offset);

  // 6. Compose final SQL
  const sql = [
    `SELECT ${select.sql}`,
    `FROM ${escapedTable}`,
    whereClause,
    orderClause,
    pagination.sql,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    sql,
    params: allParams,
    meta: {
      table,
      columns: select.columns,
      filterCount: filters.filters.length,
      limit: pagination.limit,
      offset: pagination.offset,
    },
  };
}

/**
 * Compile an INSERT query from request body.
 */
export function compileInsertQuery(
  table: string,
  body: Record<string, unknown> | Record<string, unknown>[]
): CompiledQuery {
  const escapedTable = escapeIdentifier(table);
  const rows = Array.isArray(body) ? body : [body];

  if (rows.length === 0) {
    throw new Error("No rows to insert");
  }

  // Use the keys from the first row as column list
  const columns = Object.keys(rows[0]!);

  // Empty columns = all-defaults insert: INSERT INTO table () VALUES ()
  // MySQL fills in AUTO_INCREMENT, DEFAULT CURRENT_TIMESTAMP etc automatically
  if (columns.length === 0) {
    return {
      sql: `INSERT INTO ${escapedTable} () VALUES ()`,
      params: [],
    };
  }

  const escapedColumns = columns.map((c) => escapeIdentifier(c)).join(", ");
  const rowPlaceholders = `(${columns.map(() => "?").join(", ")})`;
  const allPlaceholders = rows.map(() => rowPlaceholders).join(", ");

  const params: unknown[] = [];
  for (const row of rows) {
    for (const col of columns) {
      params.push(row[col] ?? null);
    }
  }

  const sql = `INSERT INTO ${escapedTable} (${escapedColumns}) VALUES ${allPlaceholders}`;

  return { sql, params };
}

/**
 * Compile an UPDATE query from request body and URL filters.
 */
export function compileUpdateQuery(
  options: CompileOptions,
  body: Record<string, unknown>
): CompiledQuery {
  const { table, query, rlsConditions } = options;
  const escapedTable = escapeIdentifier(table);

  const columns = Object.keys(body);
  if (columns.length === 0) {
    throw new Error("No columns to update");
  }

  const setClauses = columns.map((col) => `${escapeIdentifier(col)} = ?`).join(", ");
  const setParams = columns.map((col) => body[col] ?? null);

  // Build WHERE clause from URL filters + RLS
  const filters = compileFilters(query);
  const allConditions: string[] = [];
  const allParams: unknown[] = [...setParams];

  if (rlsConditions && rlsConditions.sql) {
    allConditions.push(`(${rlsConditions.sql})`);
    allParams.push(...rlsConditions.params);
  }

  if (filters.sql) {
    allConditions.push(`(${filters.sql})`);
    allParams.push(...filters.params);
  }

  const whereClause =
    allConditions.length > 0
      ? `WHERE ${allConditions.join(" AND ")}`
      : "";

  // SECURITY: Require at least one filter for UPDATE to prevent accidental mass-updates
  if (!whereClause) {
    throw new Error("UPDATE requires at least one filter condition");
  }

  const sql = `UPDATE ${escapedTable} SET ${setClauses} ${whereClause}`;

  return { sql, params: allParams };
}

/**
 * Compile a DELETE query from URL filters.
 */
export function compileDeleteQuery(options: CompileOptions): CompiledQuery {
  const { table, query, rlsConditions } = options;
  const escapedTable = escapeIdentifier(table);

  const filters = compileFilters(query);
  const allConditions: string[] = [];
  const allParams: unknown[] = [];

  if (rlsConditions && rlsConditions.sql) {
    allConditions.push(`(${rlsConditions.sql})`);
    allParams.push(...rlsConditions.params);
  }

  if (filters.sql) {
    allConditions.push(`(${filters.sql})`);
    allParams.push(...filters.params);
  }

  const whereClause =
    allConditions.length > 0
      ? `WHERE ${allConditions.join(" AND ")}`
      : "";

  // SECURITY: Require at least one filter for DELETE to prevent accidental mass-deletes
  if (!whereClause) {
    throw new Error("DELETE requires at least one filter condition");
  }

  const sql = `DELETE FROM ${escapedTable} ${whereClause}`;

  return { sql, params: allParams };
}
