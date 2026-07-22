/**
 * Vorebase Storage Service — Bucket Management Routes
 *
 * GET    /storage/v1/bucket          — List all buckets
 * POST   /storage/v1/bucket          — Create a bucket
 * PUT    /storage/v1/bucket/:id      — Update bucket settings
 * DELETE /storage/v1/bucket/:id      — Delete a bucket
 *
 * Buckets are logical containers for files, stored in both
 * MinIO (actual storage) and MySQL (metadata).
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  createLogger,
} from "@repo/common";

const logger = createLogger("storage-buckets");

export async function bucketRoutes(fastify: FastifyInstance) {
  /**
   * GET /storage/v1/bucket?projectId=xxx
   * List all buckets for a project.
   */
  fastify.get<{
    Querystring: { projectId?: string };
  }>(
    "/storage/v1/bucket",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const projectId = request.projectId || (request.query as any).projectId;

      if (!projectId) {
        throw new ValidationError("projectId is required");
      }

      const buckets = await prismaClient.storageBucket.findMany({
        where: { projectId },
        include: {
          _count: { select: { objects: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      reply.send({
        data: buckets.map((b) => ({
          id: b.id,
          name: b.name,
          is_public: b.isPublic,
          file_size_limit: b.fileSizeLimit,
          allowed_mime_types: b.allowedMimeTypes,
          created_at: b.createdAt,
          updated_at: b.updatedAt,
          object_count: b._count.objects,
        })),
        count: buckets.length,
        status: 200,
      });
    }
  );

  /**
   * POST /storage/v1/bucket
   * Create a new storage bucket.
   */
  fastify.post<{
    Body: {
      name: string;
      projectId: string;
      isPublic?: boolean;
      fileSizeLimit?: number;
      allowedMimeTypes?: string[];
    };
  }>(
    "/storage/v1/bucket",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const {
        name,
        projectId,
        isPublic = false,
        fileSizeLimit,
        allowedMimeTypes,
      } = request.body;

      if (!name || !projectId) {
        throw new ValidationError("name and projectId are required");
      }

      // Check for duplicate bucket name in this project
      const existing = await prismaClient.storageBucket.findFirst({
        where: { name, projectId },
      });

      if (existing) {
        throw new ConflictError(`Bucket "${name}" already exists in this project`);
      }

      // Create MinIO bucket (bucket name = projectId-bucketName for uniqueness)
      const minioBucketName = `${projectId}-${name}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      try {
        const exists = await fastify.minio.bucketExists(minioBucketName);
        if (!exists) {
          await fastify.minio.makeBucket(minioBucketName);
        }
      } catch (err: any) {
        logger.error({ err, errMsg: err?.message, errCode: err?.code, minioBucketName }, "Failed to create MinIO bucket");
        throw new Error(`Failed to create storage bucket: ${err?.message || err}`);
      }

      // Create metadata record
      const bucket = await prismaClient.storageBucket.create({
        data: {
          name,
          isPublic,
          fileSizeLimit: fileSizeLimit || null,
          allowedMimeTypes: allowedMimeTypes ?? undefined,
          projectId,
        },
      });

      reply.status(201).send({
        data: {
          id: bucket.id,
          name: bucket.name,
          is_public: bucket.isPublic,
          file_size_limit: bucket.fileSizeLimit,
          allowed_mime_types: bucket.allowedMimeTypes,
          created_at: bucket.createdAt,
        },
        status: 201,
      });
    }
  );

  /**
   * PUT /storage/v1/bucket/:id
   * Update bucket settings (public/private toggle, size limits).
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      isPublic?: boolean;
      fileSizeLimit?: number | null;
      allowedMimeTypes?: string[] | null;
    };
  }>(
    "/storage/v1/bucket/:id",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { id } = request.params;
      const { isPublic, fileSizeLimit, allowedMimeTypes } = request.body;

      const existing = await prismaClient.storageBucket.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("Bucket");
      }

      const updateData: Record<string, unknown> = {};
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (fileSizeLimit !== undefined) updateData.fileSizeLimit = fileSizeLimit;
      if (allowedMimeTypes !== undefined) updateData.allowedMimeTypes = allowedMimeTypes;

      const updated = await prismaClient.storageBucket.update({
        where: { id },
        data: updateData,
      });

      reply.send({
        data: {
          id: updated.id,
          name: updated.name,
          is_public: updated.isPublic,
          file_size_limit: updated.fileSizeLimit,
          allowed_mime_types: updated.allowedMimeTypes,
          updated_at: updated.updatedAt,
        },
        status: 200,
      });
    }
  );

  /**
   * DELETE /storage/v1/bucket/:id
   * Delete a bucket and all its objects.
   */
  fastify.delete<{ Params: { id: string } }>(
    "/storage/v1/bucket/:id",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const { id } = request.params;
      const projectId = request.projectId;

      // SECURITY: Verify bucket belongs to the authenticated user's project
      const bucket = await prismaClient.storageBucket.findUnique({
        where: { id },
      });

      if (!bucket) {
        throw new NotFoundError("Bucket");
      }

      if (projectId && bucket.projectId !== projectId) {
        throw new NotFoundError("Bucket");
      }

      const minioBucketName = `${bucket.projectId}-${bucket.name}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");

      // Delete all objects in MinIO bucket first
      try {
        const objectsList: string[] = [];
        const stream = fastify.minio.listObjects(minioBucketName, "", true);

        await new Promise<void>((resolve, reject) => {
          stream.on("data", (obj) => {
            if (obj.name) objectsList.push(obj.name);
          });
          stream.on("end", () => resolve());
          stream.on("error", (err) => reject(err));
        });

        if (objectsList.length > 0) {
          await fastify.minio.removeObjects(minioBucketName, objectsList);
        }

        await fastify.minio.removeBucket(minioBucketName);
      } catch (err) {
        logger.error({ err, minioBucketName }, "Error cleaning up MinIO bucket");
      }

      // Delete metadata (cascades to StorageObject records)
      await prismaClient.storageBucket.delete({ where: { id } });

      reply.send({
        data: { message: "Bucket deleted successfully" },
        status: 200,
      });
    }
  );
}
