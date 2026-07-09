/**
 * Vorebase Auth — POST /auth/v1/signin
 *
 * Authenticates a user and returns JWT tokens.
 *
 * SECURITY:
 * - Constant-time password comparison (bcrypt)
 * - Generic error message for wrong email OR password (no enumeration)
 * - Rate limited at the plugin level (5 req/min per IP)
 * - Updates lastSignInAt for audit trail
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  comparePassword,
  AuthError,
  JWT,
} from "@repo/common";
import type { AuthTokens } from "@repo/common";
import { signinSchema } from "../schemas/auth.schema.js";

interface SigninBody {
  email: string;
  password: string;
  projectId?: string;
}

export async function signinRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: SigninBody }>(
    "/auth/v1/signin",
    { schema: signinSchema },
    async (request, reply) => {
      const { email, password, projectId } = request.body;

      // Find user by email (and optionally project)
      const user = await prismaClient.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          ...(projectId ? { projectId } : {}),
        },
      });

      // SECURITY: Always compare even if user not found (prevent timing attacks)
      if (!user) {
        // Hash a dummy password to keep response time consistent
        await comparePassword(password, "$2b$12$invalidhashpadding00000000000000000000000000000");
        throw new AuthError("Invalid email or password");
      }

      // Compare password
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        throw new AuthError("Invalid email or password");
      }

      // Update last sign-in timestamp
      await prismaClient.user.update({
        where: { id: user.id },
        data: { lastSignInAt: new Date() },
      });

      // Generate tokens
      const accessToken = fastify.signUserToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        project_id: user.projectId,
      });

      const refreshTokenStr = fastify.signRefresh(user.id);

      // Store refresh token
      await prismaClient.refreshToken.create({
        data: {
          token: refreshTokenStr,
          userId: user.id,
          expiresAt: new Date(Date.now() + JWT.REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      const expiresIn = 15 * 60;
      const response: AuthTokens = {
        access_token: accessToken,
        refresh_token: refreshTokenStr,
        token_type: "bearer",
        expires_in: expiresIn,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      };

      reply.send({
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            last_sign_in_at: new Date().toISOString(),
          },
          session: response,
        },
        status: 200,
      });
    }
  );
}
