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
 * - Passwords hashed with bcrypt
 * - Generic error messages (no email enumeration)
 * - Admin JWT has different payload shape than user JWT
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  ValidationError,
  ConflictError,
  AuthError,
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
   */
  fastify.post<{ Body: AdminSignupBody }>(
    "/auth/v1/admin/signup",
    { schema: adminSignupSchema },
    async (request, reply) => {
      const { email, password } = request.body;

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

      const admin = await prismaClient.adminUser.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: "admin",
        },
      });

      // Generate admin JWT
      const accessToken = fastify.signAdminToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      });

      reply.status(201).send({
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            created_at: admin.createdAt,
          },
          access_token: accessToken,
          token_type: "bearer",
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

      // Generate admin JWT
      const accessToken = fastify.signAdminToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      });

      reply.send({
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
          },
          access_token: accessToken,
          token_type: "bearer",
        },
        status: 200,
      });
    }
  );
}
