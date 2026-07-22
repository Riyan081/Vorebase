/**
 * Vorebase REST API — JWT & API Key Authentication Plugin
 *
 * Provides preHandler hooks for authenticating REST API requests.
 * Supports both JWT Bearer tokens and API keys (via `apikey` header).
 *
 * After authentication, sets:
 * - request.user — decoded JWT payload or synthetic payload from API key
 * - request.projectId — the project ID this request is scoped to
 * - request.userRole — the effective role (authenticated, anon, service_role)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import {
  extractBearerToken,
  verifyToken,
  hashApiKey,
  AuthError,
  ROLES,
} from "@repo/common";
import type { JwtPayload, AdminJwtPayload } from "@repo/common";
import { prismaClient } from "@repo/db/client";

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    jwtSecret: string;
    authenticateRequest: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user?: JwtPayload | AdminJwtPayload;
    projectId?: string;
    userRole?: string;
  }
}

async function jwtPluginFn(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be set and at least 32 characters long"
    );
  }

  fastify.decorate("jwtSecret", secret);

  /**
   * Authenticate a REST API request via JWT or API key.
   * Sets request.user, request.projectId, and request.userRole.
   */
  fastify.decorate(
    "authenticateRequest",
    async function (request: FastifyRequest, reply: FastifyReply) {
      // 1. Try Bearer token
      const bearerToken = extractBearerToken(
        request.headers.authorization
      );

      if (bearerToken) {
        // Decode first (no verification) to check role field
        const decoded = verifyToken<JwtPayload | AdminJwtPayload>(bearerToken, secret);

        // Admin tokens have role "admin" or "super_admin" and NO project_id field
        const isAdminToken = (decoded.role === "admin" || decoded.role === "super_admin") && !("project_id" in decoded);

        if (isAdminToken) {
          // Admin token — project comes from x-project-id header or query param
          request.user = decoded;
          request.userRole = ROLES.SERVICE_ROLE;
          const headerProjectId = request.headers["x-project-id"] as string | undefined;
          const queryProjectId = (request.query as any)?.projectId;
          if (headerProjectId) {
            request.projectId = headerProjectId;
          } else if (queryProjectId) {
            request.projectId = queryProjectId;
          }
          return;
        } else {
          // User token — project_id is embedded in the token
          const payload = decoded as JwtPayload;
          request.user = payload;
          request.projectId = payload.project_id;
          request.userRole = payload.role;
          return;
        }
      }

      // 2. Try API key header
      const apiKey = request.headers["apikey"] as string | undefined;
      if (apiKey) {
        const keyHash = hashApiKey(apiKey);
        const foundKey = await prismaClient.apiKey.findUnique({
          where: { keyHash },
          include: { project: true },
        });

        if (foundKey) {
          // Create synthetic JWT-like payload
          request.user = {
            sub: `apikey:${foundKey.id}`,
            email: "",
            role: foundKey.role,
            project_id: foundKey.projectId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
          };
          request.projectId = foundKey.projectId;
          request.userRole = foundKey.role;
          return;
        }
      }

      throw new AuthError("Missing or invalid authentication");
    }
  );
}

export const jwtPlugin = fp(jwtPluginFn, {
  name: "jwt-plugin",
});
