/**
 * Vorebase Auth — Admin API Key Management Routes
 *
 * POST   /auth/v1/admin/keys       — Generate a new API key (anon or service_role)
 * GET    /auth/v1/admin/keys       — List API keys for a project
 * DELETE /auth/v1/admin/keys/:id   — Revoke an API key
 *
 * SECURITY:
 * - All routes require admin JWT
 * - Raw API key is returned ONLY on creation (never stored)
 * - Keys are stored as SHA-256 hashes
 * - Key prefix stored for display/identification in UI
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  generateApiKey,
  NotFoundError,
  ValidationError,
  SECURITY,
} from "@repo/common";
import type { AdminJwtPayload } from "@repo/common";
import { createApiKeySchema } from "../../schemas/auth.schema.js";

export async function adminKeysRoute(fastify: FastifyInstance) {
  /**
   * POST /auth/v1/admin/keys
   * Generate a new API key. The raw key is returned ONCE — store it safely.
   */
  fastify.post<{
    Body: { name: string; projectId: string };
  }>(
    "/auth/v1/admin/keys",
    {
      preHandler: [fastify.requireAdmin],
      schema: createApiKeySchema,
    },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { name, projectId } = request.body;

      // Verify the admin owns this project
      const project = await prismaClient.project.findFirst({
        where: { id: projectId, adminId: admin.sub },
      });

      if (!project) {
        throw new NotFoundError("Project");
      }

      // Determine prefix based on key type
      const prefix =
        name === "anon"
          ? SECURITY.API_KEY_PREFIX_ANON
          : SECURITY.API_KEY_PREFIX_SERVICE;

      // Generate key
      const { rawKey, keyHash, keyPrefix } = generateApiKey(prefix);

      // Store in DB
      const apiKey = await prismaClient.apiKey.create({
        data: {
          keyHash,
          keyPrefix,
          name,
          role: name, // "anon" or "service_role"
          projectId,
        },
      });

      reply.status(201).send({
        data: {
          id: apiKey.id,
          name: apiKey.name,
          role: apiKey.role,
          // ⚠️ Raw key shown ONLY here, never again
          api_key: rawKey,
          key_prefix: apiKey.keyPrefix,
          project_id: apiKey.projectId,
          created_at: apiKey.createdAt,
          warning:
            "Save this API key now. It will not be shown again.",
        },
        status: 201,
      });
    }
  );

  /**
   * GET /auth/v1/admin/keys?projectId=xxx
   * List all API keys for a project (shows prefix only, never the raw key).
   */
  fastify.get<{
    Querystring: { projectId: string };
  }>(
    "/auth/v1/admin/keys",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { projectId } = request.query;

      if (!projectId) {
        throw new ValidationError("projectId query parameter is required");
      }

      // Verify ownership
      const project = await prismaClient.project.findFirst({
        where: { id: projectId, adminId: admin.sub },
      });

      if (!project) {
        throw new NotFoundError("Project");
      }

      const keys = await prismaClient.apiKey.findMany({
        where: { projectId },
        select: {
          id: true,
          keyPrefix: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      reply.send({
        data: keys.map((k) => ({
          id: k.id,
          name: k.name,
          role: k.role,
          key_prefix: k.keyPrefix,
          created_at: k.createdAt,
        })),
        count: keys.length,
        status: 200,
      });
    }
  );

  /**
   * DELETE /auth/v1/admin/keys/:id
   * Revoke (delete) an API key.
   */
  fastify.delete<{ Params: { id: string } }>(
    "/auth/v1/admin/keys/:id",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { id } = request.params;

      // Find the key and verify ownership via project
      const apiKey = await prismaClient.apiKey.findUnique({
        where: { id },
        include: {
          project: {
            select: { adminId: true },
          },
        },
      });

      if (!apiKey || apiKey.project.adminId !== admin.sub) {
        throw new NotFoundError("API Key");
      }

      await prismaClient.apiKey.delete({ where: { id } });

      reply.send({
        data: { message: "API key revoked successfully" },
        status: 200,
      });
    }
  );
}
