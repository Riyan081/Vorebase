/**
 * Vorebase REST API — Dynamic CRUD Table Routes
 *
 * The heart of Vorebase: auto-generates REST endpoints for ANY table
 * in a project's database.
 *
 * GET    /rest/v1/:table  — Select rows (with filters, ordering, pagination)
 * POST   /rest/v1/:table  — Insert row(s)
 * PATCH  /rest/v1/:table  — Update row(s) matching filters
 * DELETE /rest/v1/:table  — Delete row(s) matching filters
 *
 * All queries go through the compiler pipeline and RLS enforcement.
 */

import type { FastifyInstance } from "fastify";
import { ValidationError, NotFoundError, AppError } from "@repo/common";
import type { JwtPayload } from "@repo/common";
import {
  compileSelectQuery,
  compileInsertQuery,
  compileUpdateQuery,
  compileDeleteQuery,
} from "../compiler/index.js";
import { evaluateRls } from "../plugins/rls.js";
import { validateTableAccess } from "../utils/sanitize.js";
import { tableExists } from "../utils/introspect.js";

export async function tableRoutes(fastify: FastifyInstance) {
  /**
   * GET /rest/v1/:table
   * Select rows with optional filters, ordering, and pagination.
   */
  fastify.get<{
    Params: { table: string };
    Querystring: Record<string, string | undefined>;
  }>(
    "/rest/v1/:table",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { table } = request.params;
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      // Validate table access
      validateTableAccess(table);

      // Check table exists
      if (!(await tableExists(pool, dbName, table))) {
        throw new NotFoundError(`Table "${table}"`);
      }

      // Evaluate RLS policies
      const rls = await evaluateRls(
        request.projectId!,
        table,
        "SELECT",
        request.user as JwtPayload
      );

      // Compile the query
      const compiled = compileSelectQuery({
        table,
        query: request.query,
        rlsConditions: rls.bypassed
          ? undefined
          : { sql: rls.sql, params: rls.params },
      });

      // Execute
      const [rows] = await pool.execute(compiled.sql, compiled.params);

      // Get total count (without pagination) for the response
      // Use a count query with the same WHERE clause
      let count = (rows as any[]).length;
      try {
        const countSql = `SELECT COUNT(*) as total FROM \`${table}\`${
          rls.sql ? ` WHERE ${rls.sql}` : ""
        }`;
        const [countResult] = await pool.execute(countSql, rls.params);
        count = (countResult as any[])[0]?.total ?? count;
      } catch {
        // If count fails, use the length of returned rows
      }

      reply.send({
        data: rows,
        count,
        status: 200,
      });
    }
  );

  /**
   * POST /rest/v1/:table
   * Insert one or more rows.
   */
  fastify.post<{
    Params: { table: string };
    Body: Record<string, unknown> | Record<string, unknown>[];
  }>(
    "/rest/v1/:table",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { table } = request.params;
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      validateTableAccess(table);

      if (!(await tableExists(pool, dbName, table))) {
        throw new NotFoundError(`Table "${table}"`);
      }

      // Evaluate RLS for INSERT
      const rls = await evaluateRls(
        request.projectId!,
        table,
        "INSERT",
        request.user as JwtPayload
      );

      // RLS for INSERT doesn't inject WHERE, but can deny the operation entirely
      // (the evaluateRls function throws RlsViolationError if denied)

      const body = request.body;
      if (!body || (typeof body === "object" && Object.keys(body).length === 0)) {
        throw new ValidationError("Request body is required for INSERT");
      }

      // Compile and execute
      const compiled = compileInsertQuery(table, body);
      const [result] = await pool.execute(compiled.sql, compiled.params);

      const insertResult = result as any;

      reply.status(201).send({
        data: {
          message: "Row(s) inserted successfully",
          affected_rows: insertResult.affectedRows || 0,
          insert_id: insertResult.insertId || null,
        },
        status: 201,
      });
    }
  );

  /**
   * PATCH /rest/v1/:table
   * Update rows matching the URL filters.
   */
  fastify.patch<{
    Params: { table: string };
    Querystring: Record<string, string | undefined>;
    Body: Record<string, unknown>;
  }>(
    "/rest/v1/:table",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { table } = request.params;
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      validateTableAccess(table);

      if (!(await tableExists(pool, dbName, table))) {
        throw new NotFoundError(`Table "${table}"`);
      }

      // Evaluate RLS for UPDATE
      const rls = await evaluateRls(
        request.projectId!,
        table,
        "UPDATE",
        request.user as JwtPayload
      );

      const body = request.body;
      if (!body || Object.keys(body).length === 0) {
        throw new ValidationError("Request body is required for UPDATE");
      }

      // Compile and execute
      const compiled = compileUpdateQuery(
        {
          table,
          query: request.query,
          rlsConditions: rls.bypassed
            ? undefined
            : { sql: rls.sql, params: rls.params },
        },
        body
      );

      const [result] = await pool.execute(compiled.sql, compiled.params);
      const updateResult = result as any;

      reply.send({
        data: {
          message: "Row(s) updated successfully",
          affected_rows: updateResult.affectedRows || 0,
        },
        status: 200,
      });
    }
  );

  /**
   * DELETE /rest/v1/:table
   * Delete rows matching the URL filters.
   */
  fastify.delete<{
    Params: { table: string };
    Querystring: Record<string, string | undefined>;
  }>(
    "/rest/v1/:table",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { table } = request.params;
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      validateTableAccess(table);

      if (!(await tableExists(pool, dbName, table))) {
        throw new NotFoundError(`Table "${table}"`);
      }

      // Evaluate RLS for DELETE
      const rls = await evaluateRls(
        request.projectId!,
        table,
        "DELETE",
        request.user as JwtPayload
      );

      // Compile and execute
      const compiled = compileDeleteQuery({
        table,
        query: request.query,
        rlsConditions: rls.bypassed
          ? undefined
          : { sql: rls.sql, params: rls.params },
      });

      const [result] = await pool.execute(compiled.sql, compiled.params);
      const deleteResult = result as any;

      reply.send({
        data: {
          message: "Row(s) deleted successfully",
          affected_rows: deleteResult.affectedRows || 0,
        },
        status: 200,
      });
    }
  );
}
