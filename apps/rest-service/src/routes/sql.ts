/**
 * Vorebase REST API — Raw SQL Execution Route
 *
 * POST /rest/v1/sql — Execute raw SQL against a project's database.
 *
 * Used by the SQL Editor in the dashboard. Supports SELECT, INSERT,
 * UPDATE, DELETE, CREATE, ALTER, DROP, and other DDL/DML statements.
 *
 * SECURITY:
 * - Requires authentication (admin JWT or service_role API key)
 * - Only admin/service_role can execute raw SQL (bypasses RLS)
 * - Returns rows for SELECT queries, affected_rows for mutations
 */

import type { FastifyInstance } from "fastify";
import {
  ValidationError,
  InsufficientPermissionsError,
  ROLES,
} from "@repo/common";

export async function sqlRoutes(fastify: FastifyInstance) {
  /**
   * POST /rest/v1/sql
   * Execute a raw SQL statement against the project's database.
   */
  fastify.post<{
    Body: { query: string };
  }>(
    "/rest/v1/sql",
    { preHandler: [fastify.authenticateAndAttachDb] },
    async (request, reply) => {
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      // SECURITY: Only admin and service_role can execute raw SQL
      const role = request.userRole;
      if (role !== ROLES.SERVICE_ROLE && role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
        throw new InsufficientPermissionsError(
          "Raw SQL execution requires admin or service_role access"
        );
      }

      const { query } = request.body;

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        throw new ValidationError("SQL query is required");
      }

      // Split into individual statements (handle multi-statement input like Supabase SQL editor)
      const statements = query
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (statements.length === 0) {
        throw new ValidationError("SQL query is required");
      }

      try {
        const dmlResults: Record<string, unknown>[] = [];
        const selectResults: Record<string, unknown>[] = [];

        for (const stmt of statements) {
          const trimmed = stmt.trim().toUpperCase();
          const isSelect =
            trimmed.startsWith("SELECT") ||
            trimmed.startsWith("SHOW") ||
            trimmed.startsWith("DESCRIBE") ||
            trimmed.startsWith("DESC") ||
            trimmed.startsWith("EXPLAIN");

          const [result] = await pool.execute(stmt);

          if (isSelect) {
            // SELECT rows — always show these if present
            const rows = result as Record<string, unknown>[];
            selectResults.push(...rows);
          } else {
            const mutationResult = result as any;
            dmlResults.push({
              affected_rows: mutationResult.affectedRows ?? 0,
              insert_id: mutationResult.insertId ?? null,
              changed_rows: mutationResult.changedRows ?? 0,
              message: mutationResult.info || "Query executed successfully",
            });
          }
        }

        // If any SELECT ran, show SELECT results (ignore DML metadata rows)
        // This matches Supabase behavior: INSERT + SELECT shows the SELECT results
        const finalResults = selectResults.length > 0 ? selectResults : dmlResults;

        reply.send({
          data: finalResults,
          count: finalResults.length,
          status: 200,
        });

      } catch (err: any) {
        reply.status(400).send({
          error: {
            message: err.message || "SQL execution failed",
            code: err.code || "SQL_ERROR",
            details: err.sqlMessage || null,
            hint: err.errno ? `MySQL error ${err.errno}` : null,
          },
          status: 400,
        });
      }
    }
  );
}
