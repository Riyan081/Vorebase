/**
 * Vorebase Storage Service — JWT Authentication Plugin
 *
 * Authenticates storage API requests via JWT or API key.
 * Same pattern as the REST service JWT plugin.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
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

export async function jwtPlugin(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }

  fastify.decorate("jwtSecret", secret);

  fastify.decorate(
    "authenticateRequest",
    async function (request: FastifyRequest, reply: FastifyReply) {
      // 1. Try Bearer token
      const bearerToken = extractBearerToken(request.headers.authorization);

      if (bearerToken) {
        try {
          const payload = verifyToken<JwtPayload>(bearerToken, secret);
          request.user = payload;
          request.projectId = payload.project_id;
          request.userRole = payload.role;
          return;
        } catch {
          try {
            const payload = verifyToken<AdminJwtPayload>(bearerToken, secret);
            request.user = payload;
            request.userRole = ROLES.SERVICE_ROLE;
            const headerProjectId = request.headers["x-project-id"] as string | undefined;
            const queryProjectId = (request.query as any)?.projectId;
            if (headerProjectId) {
              request.projectId = headerProjectId;
            } else if (queryProjectId) {
              request.projectId = queryProjectId;
            }
            return;
          } catch {
            throw new AuthError("Invalid or expired token");
          }
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
