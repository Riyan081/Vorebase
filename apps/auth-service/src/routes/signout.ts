/**
 * Vorebase Auth — POST /auth/v1/signout
 *
 * Revokes the user's refresh token, effectively signing them out.
 *
 * SECURITY:
 * - Requires valid JWT
 * - Revokes ALL active refresh tokens for the user
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";

export async function signoutRoute(fastify: FastifyInstance) {
  fastify.post(
    "/auth/v1/signout",
    { preHandler: [fastify.requireAuth] },
    async (request, reply) => {
      const user = request.user!;

      // Revoke all active refresh tokens for this user
      await prismaClient.refreshToken.updateMany({
        where: {
          userId: user.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      reply.send({
        data: { message: "Successfully signed out" },
        status: 200,
      });
    }
  );
}
