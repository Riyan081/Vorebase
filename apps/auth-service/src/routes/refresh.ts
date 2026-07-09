/**
 * Vorebase Auth — POST /auth/v1/token/refresh
 *
 * Exchanges a valid refresh token for a new access + refresh token pair.
 *
 * SECURITY:
 * - Refresh token rotation: old token is immediately revoked
 * - Expired tokens are rejected
 * - Revoked tokens are rejected (detects token theft)
 * - One-time use: each refresh token can only be used once
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  AuthError,
  JWT,
} from "@repo/common";
import type { AuthTokens } from "@repo/common";
import { refreshSchema } from "../schemas/auth.schema.js";

interface RefreshBody {
  refresh_token: string;
}

export async function refreshRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: RefreshBody }>(
    "/auth/v1/token/refresh",
    { schema: refreshSchema },
    async (request, reply) => {
      const { refresh_token } = request.body;

      // Find the refresh token in the database
      const storedToken = await prismaClient.refreshToken.findUnique({
        where: { token: refresh_token },
        include: { user: true },
      });

      // Validate: token exists
      if (!storedToken) {
        throw new AuthError("Invalid refresh token");
      }

      // Validate: token not revoked (detect token theft)
      if (storedToken.revokedAt) {
        // SECURITY: If a revoked token is reused, it might be stolen.
        // Revoke ALL tokens for this user as a safety measure.
        await prismaClient.refreshToken.updateMany({
          where: { userId: storedToken.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        fastify.log.warn(
          { userId: storedToken.userId },
          "Revoked refresh token reuse detected — revoking all tokens"
        );
        throw new AuthError("Refresh token has been revoked");
      }

      // Validate: token not expired
      if (storedToken.expiresAt < new Date()) {
        throw new AuthError("Refresh token has expired");
      }

      // ROTATION: Immediately revoke the old token
      await prismaClient.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const user = storedToken.user;

      // Generate new token pair
      const newAccessToken = fastify.signUserToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        project_id: user.projectId,
      });

      const newRefreshTokenStr = fastify.signRefresh(user.id);

      // Store new refresh token
      await prismaClient.refreshToken.create({
        data: {
          token: newRefreshTokenStr,
          userId: user.id,
          expiresAt: new Date(Date.now() + JWT.REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      const expiresIn = 15 * 60;
      const response: AuthTokens = {
        access_token: newAccessToken,
        refresh_token: newRefreshTokenStr,
        token_type: "bearer",
        expires_in: expiresIn,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      };

      reply.send({
        data: { session: response },
        status: 200,
      });
    }
  );
}
