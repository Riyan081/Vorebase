/**
 * Vorebase REST API — Schema Introspection Route
 *
 * GET /rest/v1/schema — Returns all tables, columns, and types
 *                        for the project's database.
 *
 * Used by the dashboard to display the schema viewer,
 * table editor, and API documentation.
 *
 * SECURITY: Requires admin JWT (schema info is sensitive).
 */

import type { FastifyInstance } from "fastify";
import { ValidationError } from "@repo/common";
import { getFullSchema, listTables, getTableColumns } from "../utils/introspect.js";

export async function schemaRoutes(fastify: FastifyInstance) {
  /**
   * GET /rest/v1/schema
   * Get full schema introspection (all tables + columns).
   */
  fastify.get(
    "/rest/v1/schema",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      const schema = await getFullSchema(pool, dbName);

      reply.send({
        data: schema,
        count: schema.length,
        status: 200,
      });
    }
  );

  /**
   * GET /rest/v1/schema/tables
   * List just the table names.
   */
  fastify.get(
    "/rest/v1/schema/tables",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      const tables = await listTables(pool, dbName);

      reply.send({
        data: tables,
        count: tables.length,
        status: 200,
      });
    }
  );

  /**
   * GET /rest/v1/schema/tables/:table
   * Get column info for a specific table.
   */
  fastify.get<{ Params: { table: string } }>(
    "/rest/v1/schema/tables/:table",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const pool = request.dbPool;
      const dbName = request.dbName;
      const { table } = request.params;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      const columns = await getTableColumns(pool, dbName, table);

      reply.send({
        data: {
          table,
          columns,
        },
        status: 200,
      });
    }
  );
}
