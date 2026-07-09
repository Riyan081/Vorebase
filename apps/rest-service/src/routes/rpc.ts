/**
 * Vorebase REST API — RPC (Remote Procedure Call) Route
 *
 * POST /rest/v1/rpc/:fn — Call a MySQL stored procedure or function.
 *
 * Body: { "arg1": "value1", "arg2": "value2" }
 * → CALL fn(value1, value2)
 *
 * SECURITY: Requires authentication. Function name is validated.
 */

import type { FastifyInstance } from "fastify";
import { ValidationError, NotFoundError } from "@repo/common";
import { escapeIdentifier } from "../utils/sanitize.js";

export async function rpcRoutes(fastify: FastifyInstance) {
  /**
   * POST /rest/v1/rpc/:fn
   * Call a stored procedure with named arguments.
   */
  fastify.post<{
    Params: { fn: string };
    Body: Record<string, unknown>;
  }>(
    "/rest/v1/rpc/:fn",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { fn } = request.params;
      const pool = request.dbPool;
      const dbName = request.dbName;

      if (!pool || !dbName) {
        throw new ValidationError("No project database context");
      }

      // Validate function name
      const escapedFn = escapeIdentifier(fn);

      // Build CALL statement with positional params
      const args = request.body || {};
      const values = Object.values(args);
      const placeholders = values.map(() => "?").join(", ");

      const sql = `CALL ${escapedFn}(${placeholders})`;

      try {
        const [rows] = await pool.execute(sql, values);

        reply.send({
          data: rows,
          status: 200,
        });
      } catch (err: any) {
        if (err.code === "ER_SP_DOES_NOT_EXIST") {
          throw new NotFoundError(`Function "${fn}"`);
        }
        throw err;
      }
    }
  );
}
