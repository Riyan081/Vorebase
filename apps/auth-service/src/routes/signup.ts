/**
 * Vorebase Auth — POST /auth/v1/signup
 *
 * Creates a new user for a project.
 *
 * SECURITY:
 * - Password hashed with bcrypt (12 rounds)
 * - Password strength validated
 * - Duplicate email returns generic error (no email enumeration)
 * - Returns JWT access + refresh tokens on success
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  hashPassword,
  validatePasswordStrength,
  ValidationError,
  ConflictError,
  NotFoundError,
  JWT,
} from "@repo/common";
import type { AuthTokens } from "@repo/common";
import { signupSchema } from "../schemas/auth.schema.js";

interface SignupBody {
  email: string;
  password: string;
  projectId?: string;
}

export async function signupRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: SignupBody }>(
    "/auth/v1/signup",
    { schema: signupSchema },
    async (request, reply) => {
      const { email, password, projectId } = request.body;

      // Validate password strength
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        throw new ValidationError(passwordError);
      }

      // If projectId is provided, verify the project exists
      if (projectId) {
        const project = await prismaClient.project.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          throw new NotFoundError("Project");
        }
      }

      // Check if user already exists (per project scope)
      const existingUser = await prismaClient.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          ...(projectId ? { projectId } : {}),
        },
      });

      if (existingUser) {
        // Generic message — don't reveal that the email is taken
        throw new ConflictError("Unable to create user");
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prismaClient.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: "authenticated",
          ...(projectId ? { projectId } : {}),
        },
      });

      // Generate tokens
      const accessToken = fastify.signUserToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        project_id: user.projectId,
      });

      const refreshTokenStr = fastify.signRefresh(user.id);

      // Store refresh token in DB
      await prismaClient.refreshToken.create({
        data: {
          token: refreshTokenStr,
          userId: user.id,
          expiresAt: new Date(Date.now() + JWT.REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      const expiresIn = 15 * 60; // 15 minutes in seconds
      const response: AuthTokens = {
        access_token: accessToken,
        refresh_token: refreshTokenStr,
        token_type: "bearer",
        expires_in: expiresIn,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      };

      reply.status(201).send({
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.createdAt,
          },
          session: response,
        },
        status: 201,
      });
    }
  );
}
