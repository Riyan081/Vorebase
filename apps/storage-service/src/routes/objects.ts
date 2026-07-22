/**
 * Vorebase Storage Service — Object (File) Routes
 *
 * POST   /storage/v1/object/:bucket/*            — Upload a file
 * GET    /storage/v1/object/:bucket/*             — Download a file
 * DELETE /storage/v1/object/:bucket/*             — Delete a file
 * POST   /storage/v1/object/list/:bucket          — List objects in a bucket
 * GET    /storage/v1/object/public/:bucket/*      — Public file access (no auth)
 *
 * KEY DESIGN: Fastify streams files directly to/from MinIO.
 * Files are NEVER held in memory — this is critical for large uploads.
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  NotFoundError,
  ValidationError,
  InsufficientPermissionsError,
  STORAGE,
  createLogger,
} from "@repo/common";
import type { JwtPayload } from "@repo/common";
import { Readable } from "stream";

const logger = createLogger("storage-objects");

/** Resolve the MinIO bucket name from project + bucket name */
function minioBucketName(projectId: string, bucketName: string): string {
  return `${projectId}-${bucketName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

export async function objectRoutes(fastify: FastifyInstance) {
  /**
   * POST /storage/v1/object/:bucket/*
   * Upload a file to a bucket.
   */
  fastify.post<{ Params: { bucket: string; "*": string } }>(
    "/storage/v1/object/:bucket/*",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const bucketName = request.params.bucket;
      const filePath = request.params["*"];

      if (!filePath) {
        throw new ValidationError("File path is required");
      }

      const projectId = request.projectId;
      if (!projectId) {
        throw new ValidationError("No project context");
      }

      // Look up the bucket
      const bucket = await prismaClient.storageBucket.findFirst({
        where: { name: bucketName, projectId },
      });

      if (!bucket) {
        throw new NotFoundError("Bucket");
      }

      // Get the uploaded file from multipart
      const data = await request.file();
      if (!data) {
        throw new ValidationError("No file uploaded");
      }

      // Pre-check file size from Content-Length header (early rejection saves bandwidth)
      if (bucket.fileSizeLimit) {
        const contentLength = parseInt(request.headers["content-length"] || "0", 10);
        if (contentLength > 0 && contentLength > bucket.fileSizeLimit) {
          throw new ValidationError(
            `File size (${contentLength} bytes) exceeds limit (${bucket.fileSizeLimit} bytes)`
          );
        }
      }

      // Check MIME type restrictions
      if (bucket.allowedMimeTypes) {
        const allowed = bucket.allowedMimeTypes as string[];
        const mimeType = data.mimetype;
        const isAllowed = allowed.some((pattern) => {
          if (pattern.endsWith("/*")) {
            return mimeType.startsWith(pattern.replace("/*", "/"));
          }
          return mimeType === pattern;
        });

        if (!isAllowed) {
          throw new ValidationError(
            `File type "${mimeType}" is not allowed. Allowed types: ${allowed.join(", ")}`
          );
        }
      }

      const mBucketName = minioBucketName(projectId, bucketName);

      // Stream file directly to MinIO
      let uploadedSize = 0;
      try {
        const result = await fastify.minio.putObject(
          mBucketName,
          filePath,
          data.file,
          undefined,
          { "Content-Type": data.mimetype }
        );
        // Get the size from what was actually uploaded
        const stat = await fastify.minio.statObject(mBucketName, filePath);
        uploadedSize = stat.size;
      } catch (err) {
        logger.error({ err, bucket: mBucketName, path: filePath }, "Upload failed");
        throw new Error("Failed to upload file");
      }

      // Check file size limit after upload
      if (bucket.fileSizeLimit && uploadedSize > bucket.fileSizeLimit) {
        // Remove the oversized file
        await fastify.minio.removeObject(mBucketName, filePath);
        throw new ValidationError(
          `File size (${uploadedSize} bytes) exceeds limit (${bucket.fileSizeLimit} bytes)`
        );
      }

      // Save metadata to MySQL (upsert — overwrite if same path)
      const userId = (request.user as JwtPayload)?.sub ?? undefined;

      await prismaClient.storageObject.upsert({
        where: {
          name_bucketId: {
            name: filePath,
            bucketId: bucket.id,
          },
        },
        create: {
          name: filePath,
          bucketId: bucket.id,
          ownerId: userId,
          mimeType: data.mimetype,
          size: uploadedSize,
        },
        update: {
          ownerId: userId,
          mimeType: data.mimetype,
          size: uploadedSize,
          updatedAt: new Date(),
        },
      });

      reply.status(201).send({
        data: {
          path: filePath,
          bucket: bucketName,
          mime_type: data.mimetype,
          size: uploadedSize,
        },
        status: 201,
      });
    }
  );

  /**
   * GET /storage/v1/object/:bucket/*
   * Download a file (requires auth).
   */
  fastify.get<{ Params: { bucket: string; "*": string } }>(
    "/storage/v1/object/:bucket/*",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const bucketName = request.params.bucket;
      const filePath = request.params["*"];
      const projectId = request.projectId;

      if (!filePath || !projectId) {
        throw new ValidationError("File path and project context required");
      }

      const bucket = await prismaClient.storageBucket.findFirst({
        where: { name: bucketName, projectId },
      });

      if (!bucket) {
        throw new NotFoundError("Bucket");
      }

      const mBucketName = minioBucketName(projectId, bucketName);

      try {
        const stat = await fastify.minio.statObject(mBucketName, filePath);
        const stream = await fastify.minio.getObject(mBucketName, filePath);

        reply
          .header("Content-Type", stat.metaData?.["content-type"] || "application/octet-stream")
          .header("Content-Length", stat.size)
          .header("Cache-Control", "public, max-age=3600")
          .send(stream);
      } catch (err: any) {
        if (err.code === "NoSuchKey" || err.code === "NotFound") {
          throw new NotFoundError("File");
        }
        throw err;
      }
    }
  );

  /**
   * GET /storage/v1/object/public/:bucket/*
   * Public file access — no authentication required.
   * Only works for public buckets.
   */
  fastify.get<{ Params: { bucket: string; "*": string } }>(
    "/storage/v1/object/public/:bucket/*",
    async (request, reply) => {
      const bucketName = request.params.bucket;
      const filePath = request.params["*"];

      if (!filePath) {
        throw new ValidationError("File path is required");
      }

      // Find the bucket — it must be public
      const bucket = await prismaClient.storageBucket.findFirst({
        where: { name: bucketName, isPublic: true },
      });

      if (!bucket) {
        throw new NotFoundError("Bucket not found or not public");
      }

      const mBucketName = minioBucketName(bucket.projectId, bucketName);

      try {
        const stat = await fastify.minio.statObject(mBucketName, filePath);
        const stream = await fastify.minio.getObject(mBucketName, filePath);

        reply
          .header("Content-Type", stat.metaData?.["content-type"] || "application/octet-stream")
          .header("Content-Length", stat.size)
          .header("Cache-Control", "public, max-age=31536000")
          .send(stream);
      } catch (err: any) {
        if (err.code === "NoSuchKey" || err.code === "NotFound") {
          throw new NotFoundError("File");
        }
        throw err;
      }
    }
  );

  /**
   * DELETE /storage/v1/object/:bucket/*
   * Delete a file.
   */
  fastify.delete<{ Params: { bucket: string; "*": string } }>(
    "/storage/v1/object/:bucket/*",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const bucketName = request.params.bucket;
      const filePath = request.params["*"];
      const projectId = request.projectId;

      if (!filePath || !projectId) {
        throw new ValidationError("File path and project context required");
      }

      const bucket = await prismaClient.storageBucket.findFirst({
        where: { name: bucketName, projectId },
      });

      if (!bucket) {
        throw new NotFoundError("Bucket");
      }

      const mBucketName = minioBucketName(projectId, bucketName);

      // Remove from MinIO
      try {
        await fastify.minio.removeObject(mBucketName, filePath);
      } catch (err) {
        logger.error({ err, path: filePath }, "Failed to remove from MinIO");
      }

      // Remove metadata
      await prismaClient.storageObject.deleteMany({
        where: {
          name: filePath,
          bucketId: bucket.id,
        },
      });

      reply.send({
        data: { message: "File deleted successfully" },
        status: 200,
      });
    }
  );

  /**
   * POST /storage/v1/object/list/:bucket
   * List objects in a bucket with optional prefix filtering.
   */
  fastify.post<{
    Params: { bucket: string };
    Body: { prefix?: string; limit?: number; offset?: number };
  }>(
    "/storage/v1/object/list/:bucket",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const bucketName = request.params.bucket;
      const projectId = request.projectId;
      const { prefix = "", limit = 100, offset = 0 } = request.body || {};

      if (!projectId) {
        throw new ValidationError("No project context");
      }

      const bucket = await prismaClient.storageBucket.findFirst({
        where: { name: bucketName, projectId },
      });

      if (!bucket) {
        throw new NotFoundError("Bucket");
      }

      // List from MySQL metadata (faster than MinIO listing for paginated results)
      const where: any = { bucketId: bucket.id };
      if (prefix) {
        where.name = { startsWith: prefix };
      }

      const [objects, total] = await Promise.all([
        prismaClient.storageObject.findMany({
          where,
          orderBy: { name: "asc" },
          skip: offset,
          take: Math.min(limit, 1000),
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            ownerId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prismaClient.storageObject.count({ where }),
      ]);

      reply.send({
        data: objects,
        count: total,
        status: 200,
      });
    }
  );
}
