/**
 * Vorebase REST API — Table DDL Management Routes
 *
 * POST   /rest/v1/schema/tables          — Create a new table
 * DELETE /rest/v1/schema/tables/:table   — Drop a table
 * POST   /rest/v1/schema/tables/:table/columns — Add a column
 * DELETE /rest/v1/schema/tables/:table/columns/:column — Drop a column
 *
 * SECURITY:
 * - All routes require admin JWT or service_role API key
 * - Uses parameterized identifier escaping to prevent SQL injection
 */

import type { FastifyInstance } from "fastify";
import {
  ValidationError,
  InsufficientPermissionsError,
  ROLES,
  createLogger,
} from "@repo/common";
import { escapeIdentifier } from "../utils/sanitize.js";

const logger = createLogger("table-ddl");

// Valid MySQL column types for validation
const VALID_COLUMN_TYPES = [
  "INT", "BIGINT", "SMALLINT", "TINYINT", "MEDIUMINT",
  "DECIMAL", "FLOAT", "DOUBLE",
  "VARCHAR", "CHAR", "TEXT", "MEDIUMTEXT", "LONGTEXT", "TINYTEXT",
  "BOOLEAN", "BOOL",
  "DATE", "DATETIME", "TIMESTAMP", "TIME", "YEAR",
  "JSON",
  "BLOB", "MEDIUMBLOB", "LONGBLOB",
  "ENUM", "SET",
  "UUID",
];

function isValidColumnType(type: string): boolean {
  const upper = type.toUpperCase().replace(/\(.*\)/, "").trim();
  return VALID_COLUMN_TYPES.includes(upper);
}

interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: string | null;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
}

export async function tableDdlRoutes(fastify: FastifyInstance) {
  // Helper: check admin/service_role access
  function assertDdlAccess(role?: string) {
    if (role !== ROLES.SERVICE_ROLE && role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
      throw new InsufficientPermissionsError(
        "Schema management requires admin or service_role access"
      );
    }
  }

  /**
   * POST /rest/v1/schema/tables
   * Create a new table with the specified columns.
   */
  fastify.post<{
    Body: {
      name: string;
      columns: ColumnDefinition[];
    };
  }>(
    "/rest/v1/schema/tables",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      assertDdlAccess(request.userRole);

      const pool = request.dbPool;
      if (!pool) throw new ValidationError("No project database context");

      const { name, columns } = request.body;

      if (!name || typeof name !== "string") {
        throw new ValidationError("Table name is required");
      }

      if (!columns || !Array.isArray(columns) || columns.length === 0) {
        throw new ValidationError("At least one column is required");
      }

      // Build column definitions
      const columnDefs: string[] = [];
      const primaryKeys: string[] = [];

      for (const col of columns) {
        if (!col.name || !col.type) {
          throw new ValidationError(`Column name and type are required`);
        }

        if (!isValidColumnType(col.type)) {
          throw new ValidationError(`Invalid column type: ${col.type}`);
        }

        let def = `${escapeIdentifier(col.name)} ${col.type}`;

        if (col.autoIncrement) {
          def += " AUTO_INCREMENT";
        }

        if (col.nullable === false) {
          def += " NOT NULL";
        }

        if (col.defaultValue !== undefined && col.defaultValue !== null) {
          // Simple default value handling
          if (col.defaultValue === "CURRENT_TIMESTAMP" || col.defaultValue === "NOW()") {
            def += ` DEFAULT ${col.defaultValue}`;
          } else {
            def += ` DEFAULT '${col.defaultValue.replace(/'/g, "''")}'`;
          }
        }

        if (col.unique) {
          def += " UNIQUE";
        }

        if (col.primaryKey) {
          primaryKeys.push(escapeIdentifier(col.name));
        }

        columnDefs.push(def);
      }

      if (primaryKeys.length > 0) {
        columnDefs.push(`PRIMARY KEY (${primaryKeys.join(", ")})`);
      }

      const escapedTable = escapeIdentifier(name);
      const sql = `CREATE TABLE ${escapedTable} (\n  ${columnDefs.join(",\n  ")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

      try {
        await pool.execute(sql);
        logger.info({ table: name }, "Table created");

        reply.status(201).send({
          data: {
            message: `Table '${name}' created successfully`,
            table: name,
            columns: columns.length,
          },
          status: 201,
        });
      } catch (err: any) {
        reply.status(400).send({
          error: {
            message: err.sqlMessage || err.message || "Failed to create table",
            code: err.code || "DDL_ERROR",
            details: null,
            hint: null,
          },
          status: 400,
        });
      }
    }
  );

  /**
   * DELETE /rest/v1/schema/tables/:table
   * Drop a table.
   */
  fastify.delete<{ Params: { table: string } }>(
    "/rest/v1/schema/tables/:table",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      assertDdlAccess(request.userRole);

      const pool = request.dbPool;
      if (!pool) throw new ValidationError("No project database context");

      const { table } = request.params;
      const escapedTable = escapeIdentifier(table);

      try {
        await pool.execute(`DROP TABLE IF EXISTS ${escapedTable}`);
        logger.info({ table }, "Table dropped");

        reply.send({
          data: { message: `Table '${table}' dropped successfully` },
          status: 200,
        });
      } catch (err: any) {
        reply.status(400).send({
          error: {
            message: err.sqlMessage || err.message || "Failed to drop table",
            code: err.code || "DDL_ERROR",
            details: null,
            hint: null,
          },
          status: 400,
        });
      }
    }
  );

  /**
   * POST /rest/v1/schema/tables/:table/columns
   * Add a column to an existing table.
   */
  fastify.post<{
    Params: { table: string };
    Body: ColumnDefinition;
  }>(
    "/rest/v1/schema/tables/:table/columns",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      assertDdlAccess(request.userRole);

      const pool = request.dbPool;
      if (!pool) throw new ValidationError("No project database context");

      const { table } = request.params;
      const col = request.body;

      if (!col.name || !col.type) {
        throw new ValidationError("Column name and type are required");
      }

      if (!isValidColumnType(col.type)) {
        throw new ValidationError(`Invalid column type: ${col.type}`);
      }

      let alterSql = `ALTER TABLE ${escapeIdentifier(table)} ADD COLUMN ${escapeIdentifier(col.name)} ${col.type}`;

      if (col.nullable === false) {
        alterSql += " NOT NULL";
      }

      if (col.defaultValue !== undefined && col.defaultValue !== null) {
        if (col.defaultValue === "CURRENT_TIMESTAMP" || col.defaultValue === "NOW()") {
          alterSql += ` DEFAULT ${col.defaultValue}`;
        } else {
          alterSql += ` DEFAULT '${col.defaultValue.replace(/'/g, "''")}'`;
        }
      }

      if (col.unique) {
        alterSql += " UNIQUE";
      }

      try {
        await pool.execute(alterSql);
        logger.info({ table, column: col.name }, "Column added");

        reply.status(201).send({
          data: {
            message: `Column '${col.name}' added to '${table}'`,
            table,
            column: col.name,
            type: col.type,
          },
          status: 201,
        });
      } catch (err: any) {
        reply.status(400).send({
          error: {
            message: err.sqlMessage || err.message || "Failed to add column",
            code: err.code || "DDL_ERROR",
            details: null,
            hint: null,
          },
          status: 400,
        });
      }
    }
  );

  /**
   * DELETE /rest/v1/schema/tables/:table/columns/:column
   * Drop a column from a table.
   */
  fastify.delete<{ Params: { table: string; column: string } }>(
    "/rest/v1/schema/tables/:table/columns/:column",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      assertDdlAccess(request.userRole);

      const pool = request.dbPool;
      if (!pool) throw new ValidationError("No project database context");

      const { table, column } = request.params;

      try {
        await pool.execute(
          `ALTER TABLE ${escapeIdentifier(table)} DROP COLUMN ${escapeIdentifier(column)}`
        );
        logger.info({ table, column }, "Column dropped");

        reply.send({
          data: { message: `Column '${column}' dropped from '${table}'` },
          status: 200,
        });
      } catch (err: any) {
        reply.status(400).send({
          error: {
            message: err.sqlMessage || err.message || "Failed to drop column",
            code: err.code || "DDL_ERROR",
            details: null,
            hint: null,
          },
          status: 400,
        });
      }
    }
  );
}
