/**
 * Vorebase Auth — Admin Project Management Routes
 *
 * POST   /auth/v1/admin/projects       — Create a new project
 * GET    /auth/v1/admin/projects       — List all projects for the admin
 * GET    /auth/v1/admin/projects/:id   — Get project details
 * PUT    /auth/v1/admin/projects/:id   — Update project
 * DELETE /auth/v1/admin/projects/:id   — Delete project
 *
 * SECURITY:
 * - All routes require admin JWT
 * - Each project creates its own MySQL database for isolation
 * - Admins can only see/manage their own projects
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  NotFoundError,
  ValidationError,
  sanitizeIdentifier,
  createLogger,
} from "@repo/common";
import type { AdminJwtPayload } from "@repo/common";
import mysql from "mysql2/promise";

const logger = createLogger("admin-projects");

// Generate a safe database name from project name
function generateDbName(projectName: string): string {
  const safe = sanitizeIdentifier(projectName.toLowerCase().replace(/\s+/g, "_"));
  const suffix = Math.random().toString(36).substring(2, 8);
  return `vorebase_proj_${safe}_${suffix}`;
}

const createProjectSchema = {
  body: {
    type: "object" as const,
    required: ["name"],
    properties: {
      name: {
        type: "string" as const,
        minLength: 1,
        maxLength: 100,
      },
      description: {
        type: "string" as const,
        maxLength: 500,
      },
    },
    additionalProperties: false,
  },
};

const updateProjectSchema = {
  body: {
    type: "object" as const,
    properties: {
      name: {
        type: "string" as const,
        minLength: 1,
        maxLength: 100,
      },
      description: {
        type: "string" as const,
        maxLength: 500,
      },
    },
    additionalProperties: false,
  },
};

export async function adminProjectsRoute(fastify: FastifyInstance) {
  /**
   * POST /auth/v1/admin/projects
   * Create a new project and its isolated MySQL database.
   */
  fastify.post<{ Body: { name: string; description?: string } }>(
    "/auth/v1/admin/projects",
    {
      preHandler: [fastify.requireAdmin],
      schema: createProjectSchema,
    },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { name, description } = request.body;

      // Generate a unique database name for this project
      const dbName = generateDbName(name);

      // Create project record
      const project = await prismaClient.project.create({
        data: {
          name,
          description: description || null,
          dbName,
          adminId: admin.sub,
        },
      });

      // Create the project's MySQL database
      try {
        const connection = await mysql.createConnection(
          process.env.DATABASE_URL!.replace(/\/[^/]*$/, "") // connect without specifying a database
        );
        // Use backtick escaping for the database name
        await connection.execute(
          `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await connection.end();
        logger.info({ dbName, projectId: project.id }, "Created project database");
      } catch (err) {
        // If database creation fails, clean up the project record
        await prismaClient.project.delete({ where: { id: project.id } });
        logger.error({ err, dbName }, "Failed to create project database");
        throw new Error("Failed to create project database");
      }

      reply.status(201).send({
        data: {
          id: project.id,
          name: project.name,
          description: project.description,
          db_name: project.dbName,
          created_at: project.createdAt,
        },
        status: 201,
      });
    }
  );

  /**
   * GET /auth/v1/admin/projects
   * List all projects belonging to the authenticated admin.
   */
  fastify.get(
    "/auth/v1/admin/projects",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;

      const projects = await prismaClient.project.findMany({
        where: { adminId: admin.sub },
        include: {
          _count: {
            select: {
              users: true,
              buckets: true,
              apiKeys: true,
              rlsPolicies: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      reply.send({
        data: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          db_name: p.dbName,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
          counts: {
            users: p._count.users,
            buckets: p._count.buckets,
            api_keys: p._count.apiKeys,
            rls_policies: p._count.rlsPolicies,
          },
        })),
        status: 200,
      });
    }
  );

  /**
   * GET /auth/v1/admin/projects/:id
   * Get details for a specific project.
   */
  fastify.get<{ Params: { id: string } }>(
    "/auth/v1/admin/projects/:id",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { id } = request.params;

      const project = await prismaClient.project.findFirst({
        where: { id, adminId: admin.sub },
        include: {
          apiKeys: {
            select: {
              id: true,
              keyPrefix: true,
              name: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              users: true,
              buckets: true,
              rlsPolicies: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundError("Project");
      }

      reply.send({
        data: {
          id: project.id,
          name: project.name,
          description: project.description,
          db_name: project.dbName,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
          api_keys: project.apiKeys,
          counts: {
            users: project._count.users,
            buckets: project._count.buckets,
            rls_policies: project._count.rlsPolicies,
          },
        },
        status: 200,
      });
    }
  );

  /**
   * PUT /auth/v1/admin/projects/:id
   * Update project name or description.
   */
  fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string } }>(
    "/auth/v1/admin/projects/:id",
    {
      preHandler: [fastify.requireAdmin],
      schema: updateProjectSchema,
    },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { id } = request.params;
      const { name, description } = request.body;

      // Verify ownership
      const existing = await prismaClient.project.findFirst({
        where: { id, adminId: admin.sub },
      });

      if (!existing) {
        throw new NotFoundError("Project");
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError("No fields to update");
      }

      const updated = await prismaClient.project.update({
        where: { id },
        data: updateData,
      });

      reply.send({
        data: {
          id: updated.id,
          name: updated.name,
          description: updated.description,
          db_name: updated.dbName,
          updated_at: updated.updatedAt,
        },
        status: 200,
      });
    }
  );

  /**
   * DELETE /auth/v1/admin/projects/:id
   * Delete a project and drop its MySQL database.
   */
  fastify.delete<{ Params: { id: string } }>(
    "/auth/v1/admin/projects/:id",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const admin = request.user as AdminJwtPayload;
      const { id } = request.params;

      // Verify ownership
      const project = await prismaClient.project.findFirst({
        where: { id, adminId: admin.sub },
      });

      if (!project) {
        throw new NotFoundError("Project");
      }

      // Delete project record (cascades to users, API keys, buckets, etc.)
      await prismaClient.project.delete({ where: { id } });

      // Drop the project's MySQL database
      try {
        const connection = await mysql.createConnection(
          process.env.DATABASE_URL!.replace(/\/[^/]*$/, "")
        );
        await connection.execute(`DROP DATABASE IF EXISTS \`${project.dbName}\``);
        await connection.end();
        logger.info({ dbName: project.dbName }, "Dropped project database");
      } catch (err) {
        // Log but don't fail — the project record is already deleted
        logger.error({ err, dbName: project.dbName }, "Failed to drop project database");
      }

      reply.send({
        data: { message: "Project deleted successfully" },
        status: 200,
      });
    }
  );
}
