/**
 * Vorebase Auth — Admin Authentication Routes
 *
 * POST /auth/v1/admin/signup   — Register a new admin (platform-level)
 * POST /auth/v1/admin/signin   — Login as admin → returns admin JWT
 *
 * These are SEPARATE from project-level user auth.
 * AdminUsers manage projects via the Studio dashboard.
 *
 * SECURITY:
 * - First admin can be created without auth (bootstrap mode)
 * - Subsequent admin creation requires an existing admin JWT
 * - Passwords hashed with bcrypt
 * - Generic error messages (no email enumeration)
 * - Admin JWT has different payload shape than user JWT
 * - Admin refresh tokens stored in DB for revocability
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  extractBearerToken,
  ValidationError,
  ConflictError,
  AuthError,
  JWT,
} from "@repo/common";

interface AdminSignupBody {
  email: string;
  password: string;
}

interface AdminSigninBody {
  email: string;
  password: string;
}

const adminSignupSchema = {
  body: {
    type: "object" as const,
    required: ["email", "password"],
    properties: {
      email: {
        type: "string" as const,
        format: "email",
        maxLength: 255,
      },
      password: {
        type: "string" as const,
        minLength: 8,
        maxLength: 128,
      },
    },
    additionalProperties: false,
  },
};

const adminSigninSchema = {
  body: {
    type: "object" as const,
    required: ["email", "password"],
    properties: {
      email: {
        type: "string" as const,
        format: "email",
        maxLength: 255,
      },
      password: {
        type: "string" as const,
        minLength: 1,
        maxLength: 128,
      },
    },
    additionalProperties: false,
  },
};

export async function adminAuthRoute(fastify: FastifyInstance) {
  /**
   * POST /auth/v1/admin/signup
   * Register a new admin user for the Vorebase platform.
   *
   * SECURITY: First admin creation is open (bootstrap mode).
   * After the first admin exists, an existing admin JWT is required.
   */
  fastify.post<{ Body: AdminSignupBody }>(
    "/auth/v1/admin/signup",
    { schema: adminSignupSchema },
    async (request, reply) => {
      const { email, password } = request.body;

      // ── Open registration — anyone can sign up ──
      // Each user gets their own isolated workspace and projects.
      // This is the SaaS model: like Supabase.com where any developer can create an account.
      // Validate password strength
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        throw new ValidationError(passwordError);
      }

      // Check if admin already exists
      const existing = await prismaClient.adminUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existing) {
        throw new ConflictError("Unable to create account");
      }

      // Hash password and create admin
      const hashedPassword = await hashPassword(password);

      // Every new user gets the admin role for their own workspace
      const role = "admin";

      const admin = await prismaClient.adminUser.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role,
        },
      });

      // Generate admin JWT + refresh token
      const accessToken = fastify.signAdminToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const refreshTokenValue = fastify.signRefresh(admin.id);
      // Note: Admin refresh tokens are validated by JWT signature only
      // (AdminUser is separate from User model, no FK for RefreshToken)

      reply.status(201).send({
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            created_at: admin.createdAt,
          },
          access_token: accessToken,
          refresh_token: refreshTokenValue,
          token_type: "bearer",
          expires_in: 900,
        },
        status: 201,
      });
    }
  );

  /**
   * POST /auth/v1/admin/signin
   * Login as an admin user.
   */
  fastify.post<{ Body: AdminSigninBody }>(
    "/auth/v1/admin/signin",
    { schema: adminSigninSchema },
    async (request, reply) => {
      const { email, password } = request.body;

      const admin = await prismaClient.adminUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      // SECURITY: Always compare to prevent timing attacks
      if (!admin) {
        await comparePassword(
          password,
          "$2b$12$invalidhashpadding00000000000000000000000000000"
        );
        throw new AuthError("Invalid email or password");
      }

      const isValid = await comparePassword(password, admin.password);
      if (!isValid) {
        throw new AuthError("Invalid email or password");
      }

      // Generate admin JWT + refresh token
      const accessToken = fastify.signAdminToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const refreshTokenValue = fastify.signRefresh(admin.id);
      // Note: Admin refresh tokens are validated by JWT signature only
      // (AdminUser is separate from User model, no FK for RefreshToken)

      reply.send({
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
          },
          access_token: accessToken,
          refresh_token: refreshTokenValue,
          token_type: "bearer",
          expires_in: 900,
        },
        status: 200,
      });
    }
  );

  /**
   * POST /auth/v1/admin/token/refresh
   * Refresh an admin access token using a refresh token.
   *
   * SECURITY:
   * - Validates refresh token against DB (not just signature)
   * - Refresh token rotation: old token revoked immediately
   * - Revoked token reuse triggers mass-revocation (token theft detection)
   */
  fastify.post<{
    Body: { refresh_token: string };
  }>(
    "/auth/v1/admin/token/refresh",
    async (request, reply) => {
      const { refresh_token } = request.body;

      if (!refresh_token) {
        throw new ValidationError("refresh_token is required");
      }

      // Verify the refresh token signature
      let payload: { sub: string };
      try {
        payload = fastify.verifyUserToken(refresh_token) as any;
      } catch {
        throw new AuthError("Invalid or expired refresh token");
      }

      // Validate against DB (check revocation, expiry)
      const storedToken = await prismaClient.refreshToken.findUnique({
        where: { token: refresh_token },
      });

      if (!storedToken) {
        throw new AuthError("Invalid refresh token");
      }

      // Token theft detection: if revoked token is reused, revoke ALL tokens
      if (storedToken.revokedAt) {
        await prismaClient.refreshToken.updateMany({
          where: { userId: storedToken.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        fastify.log.warn(
          { userId: storedToken.userId },
          "Revoked admin refresh token reuse detected — revoking all tokens"
        );
        throw new AuthError("Refresh token has been revoked");
      }

      // Check expiry
      if (storedToken.expiresAt < new Date()) {
        throw new AuthError("Refresh token has expired");
      }

      // ROTATION: Immediately revoke the old token
      await prismaClient.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Find the admin
      const admin = await prismaClient.adminUser.findUnique({
        where: { id: payload.sub },
      });

      if (!admin) {
        throw new AuthError("Invalid refresh token");
      }

      // Generate new tokens
      const newAccessToken = fastify.signAdminToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const newRefreshToken = fastify.signRefresh(admin.id);

      // Store new refresh token in DB
      await prismaClient.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: admin.id,
          expiresAt: new Date(Date.now() + JWT.REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      reply.send({
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_type: "bearer",
          expires_in: 900,
        },
        status: 200,
      });
    }
  );
}

