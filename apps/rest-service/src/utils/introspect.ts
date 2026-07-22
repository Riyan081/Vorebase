/**
 * Vorebase REST API — MySQL Schema Introspection
 *
 * Reads INFORMATION_SCHEMA to discover tables and columns
 * in a project's database. Used for:
 * - Schema introspection endpoint (GET /rest/v1/schema)
 * - Validating table/column names before query execution
 * - Auto-generating API documentation
 */

import type { Pool } from "mysql2/promise";
import type { TableInfo, ColumnInfo } from "@repo/common";

/**
 * List all user tables in the project database.
 * Excludes views and system tables.
 */
export async function listTables(
  pool: Pool,
  databaseName: string
): Promise<string[]> {
  const [rows] = await pool.execute<any[]>(
    `SELECT TABLE_NAME 
     FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = ? 
       AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
    [databaseName]
  );

  return rows.map((row: any) => row.TABLE_NAME);
}

/**
 * Get detailed column info for a specific table.
 */
export async function getTableColumns(
  pool: Pool,
  databaseName: string,
  tableName: string
): Promise<ColumnInfo[]> {
  const [rows] = await pool.execute<any[]>(
    `SELECT 
       COLUMN_NAME as name,
       DATA_TYPE as type,
       COLUMN_KEY as columnKey,
       IS_NULLABLE as isNullable,
       COLUMN_DEFAULT as defaultValue,
       EXTRA as extra
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [databaseName, tableName]
  );

  return rows.map((row: any) => ({
    name: row.name,
    type: row.type.toUpperCase(),
    isPrimaryKey: row.columnKey === "PRI",
    isUnique: row.columnKey === "UNI" || row.columnKey === "PRI",
    nullable: row.isNullable === "YES",
    defaultValue: row.defaultValue ?? null,
    autoIncrement: (row.extra || "").toLowerCase().includes("auto_increment"),
  }));
}

/**
 * Get full schema info for all tables in the database.
 * Includes column details and approximate row counts.
 */
export async function getFullSchema(
  pool: Pool,
  databaseName: string
): Promise<TableInfo[]> {
  const tableNames = await listTables(pool, databaseName);
  const tables: TableInfo[] = [];

  for (const tableName of tableNames) {
    const columns = await getTableColumns(pool, databaseName, tableName);

    // Get approximate row count (fast, uses table statistics)
    const [countRows] = await pool.execute<any[]>(
      `SELECT TABLE_ROWS as rowCount
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = ?`,
      [databaseName, tableName]
    );

    const rowCount = countRows[0]?.rowCount ?? 0;

    tables.push({
      name: tableName,
      columns,
      rowCount,
    });
  }

  return tables;
}

/**
 * Check if a table exists in the project database.
 */
export async function tableExists(
  pool: Pool,
  databaseName: string,
  tableName: string
): Promise<boolean> {
  const [rows] = await pool.execute<any[]>(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     LIMIT 1`,
    [databaseName, tableName]
  );

  return rows.length > 0;
}
