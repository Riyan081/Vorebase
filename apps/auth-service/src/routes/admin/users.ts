/**
 * Vorebase Auth — Admin User Management Routes
 *
 * GET    /auth/v1/admin/users          — List all users for a project
 * GET    /auth/v1/admin/users/:id      — Get user details
 * POST   /auth/v1/admin/users          — Admin creates a user directly
 * DELETE /auth/v1/admin/users/:id      — Delete a user
 *
 * SECURITY:
 * - All routes require admin JWT
 * - Project ID is required via query param or body
 * - Only shows users belonging to the admin's projects
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  hashPassword,
  validatePasswordStrength,
  NotFoundError,
  ValidationError,
  ConflictError,
  InsufficientPermissionsError,
} from "@repo/common";
import type { AdminJwtPayload } from "@repo/common";
import { adminCreateUserSchema } from "../../schemas/auth.schema.js";

export async function adminUsersRoute(fastify: FastifyInstance) {
  /**
   * GET /auth/v1/admin/users?projectId=xxx
   * List all users for a specific project. Supports pagination.
   */
  fastify.get<{
    Querystring: { projectId: string; page?: string; limit?: string };
  }>(
    "/auth/v1/admin/users",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { projectId, page = "1", limit = "50" } = request.query;

      if (!projectId) {
        throw new ValidationError("projectId query parameter is required");
      }

      // Verify the admin owns this project
      const project = await prismaClient.project.findFirst({
        where: { id: projectId, adminId: admin.sub },
      });

      if (!project) {
        throw new NotFoundError("Project");
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        prismaClient.user.findMany({
          where: { projectId },
          select: {
            id: true,
            email: true,
            role: true,
            metadata: true,
            appMetadata: true,
            lastSignInAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prismaClient.user.count({ where: { projectId } }),
      ]);

      reply.send({
        data: users,
        count: total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum),
        status: 200,
      });
    }
  );

  /**
   * GET /auth/v1/admin/users/:id
   * Get details for a specific user.
   */
  fastify.get<{ Params: { id: string } }>(
    "/auth/v1/admin/users/:id",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { id } = request.params;

      const user = await prismaClient.user.findUnique({
        where: { id },
        include: {
          project: {
            select: { id: true, name: true, adminId: true },
          },
          _count: {
            select: { refreshTokens: true },
          },
        },
      });

      if (!user || user.project.adminId !== admin.sub) {
        throw new NotFoundError("User");
      }

      reply.send({
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          metadata: user.metadata,
          app_metadata: user.appMetadata,
          last_sign_in_at: user.lastSignInAt,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          project_id: user.projectId,
          active_sessions: user._count.refreshTokens,
        },
        status: 200,
      });
    }
  );

  /**
   * POST /auth/v1/admin/users
   * Admin creates a user directly (bypasses normal signup flow).
   */
  fastify.post<{
    Body: {
      email: string;
      password: string;
      projectId: string;
      role?: string;
      autoConfirm?: boolean;
    };
  }>(
    "/auth/v1/admin/users",
    {
      preHandler: [fastify.requireAdmin],
      schema: adminCreateUserSchema,
    },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { email, password, projectId, role = "authenticated" } = request.body;

      // Verify the admin owns this project
      const project = await prismaClient.project.findFirst({
        where: { id: projectId, adminId: admin.sub },
      });

      if (!project) {
        throw new NotFoundError("Project");
      }

      // Validate password
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        throw new ValidationError(passwordError);
      }

      // Check for duplicate
      const existing = await prismaClient.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          projectId,
        },
      });

      if (existing) {
        throw new ConflictError("User with this email already exists in this project");
      }

      const hashedPassword = await hashPassword(password);

      const user = await prismaClient.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role,
          projectId,
        },
      });

      reply.status(201).send({
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.createdAt,
          project_id: user.projectId,
        },
        status: 201,
      });
    }
  );

  /**
   * PUT /auth/v1/admin/users/:id
   * Admin updates a user's role, email, password, or metadata.
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      email?: string;
      password?: string;
      role?: string;
      metadata?: Record<string, unknown>;
      appMetadata?: Record<string, unknown>;
    };
  }>(
    "/auth/v1/admin/users/:id",
    {
      preHandler: [fastify.requireAdmin],
      schema: {
        body: {
          type: "object" as const,
          properties: {
            email: { type: "string" as const, format: "email", maxLength: 255 },
            password: { type: "string" as const, minLength: 8, maxLength: 128 },
            role: { type: "string" as const, enum: ["authenticated", "anon", "service_role"] },
            metadata: { type: "object" as const },
            appMetadata: { type: "object" as const },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { id } = request.params;
      const { email, password, role, metadata, appMetadata } = request.body;

      // Find user and verify the admin owns the project
      const user = await prismaClient.user.findUnique({
        where: { id },
        include: {
          project: {
            select: { id: true, adminId: true },
          },
        },
      });

      if (!user || user.project.adminId !== admin.sub) {
        throw new NotFoundError("User");
      }

      const updateData: Record<string, unknown> = {};

      if (email !== undefined) {
        const normalizedEmail = email.toLowerCase().trim();
        // Check for duplicate within the same project
        const existing = await prismaClient.user.findFirst({
          where: {
            email: normalizedEmail,
            projectId: user.projectId,
            id: { not: id },
          },
        });
        if (existing) {
          throw new ConflictError("A user with this email already exists in this project");
        }
        updateData.email = normalizedEmail;
      }

      if (password !== undefined) {
        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
          throw new ValidationError(passwordError);
        }
        updateData.password = await hashPassword(password);
      }

      if (role !== undefined) {
        const allowedRoles = ["authenticated", "anon", "service_role"];
        if (!allowedRoles.includes(role)) {
          throw new ValidationError(`Invalid role. Allowed: ${allowedRoles.join(", ")}`);
        }
        updateData.role = role;
      }

      if (metadata !== undefined) {
        updateData.metadata = metadata;
      }

      if (appMetadata !== undefined) {
        updateData.appMetadata = appMetadata;
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError("No fields to update");
      }

      const updated = await prismaClient.user.update({
        where: { id },
        data: updateData,
      });

      reply.send({
        data: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          metadata: updated.metadata,
          app_metadata: updated.appMetadata,
          updated_at: updated.updatedAt,
        },
        status: 200,
      });
    }
  );

  /**
   * DELETE /auth/v1/admin/users/:id
   * Delete a user and all their refresh tokens.
   */
  fastify.delete<{ Params: { id: string } }>(
    "/auth/v1/admin/users/:id",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { id } = request.params;

      // Find user and verify the admin owns the project
      const user = await prismaClient.user.findUnique({
        where: { id },
        include: {
          project: {
            select: { adminId: true },
          },
        },
      });

      if (!user || user.project.adminId !== admin.sub) {
        throw new NotFoundError("User");
      }

      // Delete user (cascades to refresh tokens via onDelete: Cascade)
      await prismaClient.user.delete({ where: { id } });

      reply.send({
        data: { message: "User deleted successfully" },
        status: 200,
      });
    }
  );
}

