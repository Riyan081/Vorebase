/**
 * Vorebase Auth Service — Auth Guard Plugin
 *
 * Provides preHandler hooks that protect routes:
 * - requireAuth: any valid JWT
 * - requireAdmin: JWT with admin or super_admin role
 *
 * SECURITY:
 * - Checks both Bearer token and apikey header
 * - Returns generic 401 on failure (no information leakage)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  extractBearerToken,
  AuthError,
  InsufficientPermissionsError,
  ROLES,
} from "@repo/common";
import { prismaClient } from "@repo/db/client";
import { hashApiKey } from "@repo/common";

export async function authGuardPlugin(fastify: FastifyInstance) {
  /**
   * preHandler hook: Requires a valid JWT or API key.
   * Sets request.user with the decoded payload.
   */
  fastify.decorate(
    "requireAuth",
    async function (request: FastifyRequest, reply: FastifyReply) {
      // Try Bearer token first
      const bearerToken = extractBearerToken(
        request.headers.authorization
      );

      if (bearerToken) {
        try {
          request.user = fastify.verifyUserToken(bearerToken);
          return;
        } catch {
          // Try as admin token
          try {
            request.user = fastify.verifyAdminToken(bearerToken);
            return;
          } catch {
            throw new AuthError("Invalid or expired token");
          }
        }
      }

      // Try apikey header
      const apiKey = request.headers["apikey"] as string | undefined;
      if (apiKey) {
        const keyHash = hashApiKey(apiKey);
        const foundKey = await prismaClient.apiKey.findUnique({
          where: { keyHash },
          include: { project: true },
        });

        if (foundKey) {
          // Create a synthetic JWT-like payload for API key auth
          request.user = {
            sub: `apikey:${foundKey.id}`,
            email: "",
            role: foundKey.role,
            project_id: foundKey.projectId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
          };
          return;
        }
      }

      throw new AuthError("Missing or invalid authentication");
    }
  );

  /**
   * preHandler hook: Requires admin role.
   */
  fastify.decorate(
    "requireAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      // First, run requireAuth
      await (fastify as any).requireAuth(request, reply);

      const user = request.user;
      if (
        !user ||
        (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN)
      ) {
        throw new InsufficientPermissionsError(
          "Admin access required"
        );
      }
    }
  );
}

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    requireAdmin: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
