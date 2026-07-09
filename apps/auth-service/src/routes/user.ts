/**
 * Vorebase Auth — GET/PUT /auth/v1/user
 *
 * GET  — Returns the currently authenticated user's profile.
 * PUT  — Updates the user's email, password, or metadata.
 *
 * SECURITY:
 * - Requires valid JWT
 * - Password is re-hashed if updated
 * - Cannot change role via this endpoint
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  hashPassword,
  validatePasswordStrength,
  NotFoundError,
  ValidationError,
} from "@repo/common";
import { updateUserSchema } from "../schemas/auth.schema.js";

interface UpdateUserBody {
  email?: string;
  password?: string;
  metadata?: Record<string, unknown>;
}

export async function userRoute(fastify: FastifyInstance) {
  // GET /auth/v1/user — Get current user
  fastify.get(
    "/auth/v1/user",
    { preHandler: [fastify.requireAuth] },
    async (request, reply) => {
      const payload = request.user!;

      const user = await prismaClient.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          metadata: true,
          appMetadata: true,
          lastSignInAt: true,
          createdAt: true,
          updatedAt: true,
          projectId: true,
        },
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      reply.send({
        data: user,
        status: 200,
      });
    }
  );

  // PUT /auth/v1/user — Update current user
  fastify.put<{ Body: UpdateUserBody }>(
    "/auth/v1/user",
    {
      preHandler: [fastify.requireAuth],
      schema: updateUserSchema,
    },
    async (request, reply) => {
      const payload = request.user!;
      const { email, password, metadata } = request.body;

      const updateData: Record<string, unknown> = {};

      if (email) {
        updateData.email = email.toLowerCase().trim();
      }

      if (password) {
        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
          throw new ValidationError(passwordError);
        }
        updateData.password = await hashPassword(password);
      }

      if (metadata !== undefined) {
        updateData.metadata = metadata;
      }

      const updatedUser = await prismaClient.user.update({
        where: { id: payload.sub },
        data: updateData,
        select: {
          id: true,
          email: true,
          role: true,
          metadata: true,
          updatedAt: true,
        },
      });

      reply.send({
        data: updatedUser,
        status: 200,
      });
    }
  );
}
