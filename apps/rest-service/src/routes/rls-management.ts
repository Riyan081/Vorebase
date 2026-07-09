/**
 * Vorebase REST API — RLS Policy Management Routes
 *
 * GET    /rest/v1/rls/policies              — List policies for a project
 * POST   /rest/v1/rls/policies              — Create a new policy
 * PUT    /rest/v1/rls/policies/:id          — Update a policy
 * DELETE /rest/v1/rls/policies/:id          — Delete a policy
 * PATCH  /rest/v1/rls/policies/:id/toggle   — Enable/disable a policy
 *
 * SECURITY: All routes require admin JWT.
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import { NotFoundError, ValidationError } from "@repo/common";
import type { AdminJwtPayload } from "@repo/common";

export async function rlsManagementRoutes(fastify: FastifyInstance) {
  /**
   * GET /rest/v1/rls/policies?projectId=xxx
   */
  fastify.get<{
    Querystring: { projectId: string; tableName?: string };
  }>(
    "/rest/v1/rls/policies",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { projectId, tableName } = request.query;

      if (!projectId) {
        throw new ValidationError("projectId query parameter is required");
      }

      const where: any = { projectId };
      if (tableName) {
        where.tableName = tableName;
      }

      const policies = await prismaClient.rlsPolicy.findMany({
        where,
        orderBy: [{ tableName: "asc" }, { createdAt: "desc" }],
      });

      reply.send({
        data: policies,
        count: policies.length,
        status: 200,
      });
    }
  );

  /**
   * POST /rest/v1/rls/policies
   */
  fastify.post<{
    Body: {
      name: string;
      tableName: string;
      operation: string;
      check: { column: string; op: string; value: string };
      roles?: string[];
      projectId: string;
    };
  }>(
    "/rest/v1/rls/policies",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { name, tableName, operation, check, roles, projectId } = request.body;

      if (!name || !tableName || !operation || !check || !projectId) {
        throw new ValidationError("name, tableName, operation, check, and projectId are required");
      }

      // Validate operation
      const validOps = ["SELECT", "INSERT", "UPDATE", "DELETE", "ALL"];
      if (!validOps.includes(operation.toUpperCase())) {
        throw new ValidationError(
          `operation must be one of: ${validOps.join(", ")}`
        );
      }

      const policy = await prismaClient.rlsPolicy.create({
        data: {
          name,
          tableName,
          operation: operation.toUpperCase(),
          check,
          roles: roles || ["authenticated"],
          projectId,
        },
      });

      reply.status(201).send({
        data: policy,
        status: 201,
      });
    }
  );

  /**
   * PUT /rest/v1/rls/policies/:id
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      tableName?: string;
      operation?: string;
      check?: { column: string; op: string; value: string };
      roles?: string[];
    };
  }>(
    "/rest/v1/rls/policies/:id",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { id } = request.params;
      const { name, tableName, operation, check, roles } = request.body;

      const existing = await prismaClient.rlsPolicy.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("RLS Policy");
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (tableName !== undefined) updateData.tableName = tableName;
      if (operation !== undefined) updateData.operation = operation.toUpperCase();
      if (check !== undefined) updateData.check = check;
      if (roles !== undefined) updateData.roles = roles;

      const updated = await prismaClient.rlsPolicy.update({
        where: { id },
        data: updateData,
      });

      reply.send({
        data: updated,
        status: 200,
      });
    }
  );

  /**
   * DELETE /rest/v1/rls/policies/:id
   */
  fastify.delete<{ Params: { id: string } }>(
    "/rest/v1/rls/policies/:id",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { id } = request.params;

      const existing = await prismaClient.rlsPolicy.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("RLS Policy");
      }

      await prismaClient.rlsPolicy.delete({ where: { id } });

      reply.send({
        data: { message: "Policy deleted successfully" },
        status: 200,
      });
    }
  );

  /**
   * PATCH /rest/v1/rls/policies/:id/toggle
   * Enable or disable a policy.
   */
  fastify.patch<{ Params: { id: string } }>(
    "/rest/v1/rls/policies/:id/toggle",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { id } = request.params;

      const existing = await prismaClient.rlsPolicy.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("RLS Policy");
      }

      const updated = await prismaClient.rlsPolicy.update({
        where: { id },
        data: { isEnabled: !existing.isEnabled },
      });

      reply.send({
        data: updated,
        status: 200,
      });
    }
  );
}
