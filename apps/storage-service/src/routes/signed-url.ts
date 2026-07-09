/**
 * Vorebase Storage Service — Signed URL Routes
 *
 * POST /storage/v1/object/sign/:bucket/*  — Generate a time-limited signed URL
 *
 * Signed URLs allow temporary access to private files without
 * requiring authentication on each request. Useful for:
 * - Sharing files temporarily
 * - Embedding private images in web pages
 * - Download links with expiry
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  NotFoundError,
  ValidationError,
  STORAGE,
} from "@repo/common";

export async function signedUrlRoutes(fastify: FastifyInstance) {
  /**
   * POST /storage/v1/object/sign/:bucket/*
   * Generate a presigned URL for downloading a file.
   */
  fastify.post<{
    Params: { bucket: string; "*": string };
    Body: { expiresIn?: number };
  }>(
    "/storage/v1/object/sign/:bucket/*",
    { preHandler: [fastify.authenticateRequest] },
    async (request, reply) => {
      const bucketName = request.params.bucket;
      const filePath = request.params["*"];
      const projectId = request.projectId;
      const { expiresIn = STORAGE.SIGNED_URL_EXPIRY_SECONDS } =
        request.body || {};

      if (!filePath || !projectId) {
        throw new ValidationError("File path and project context required");
      }

      // Look up bucket
      const bucket = await prismaClient.storageBucket.findFirst({
        where: { name: bucketName, projectId },
      });

      if (!bucket) {
        throw new NotFoundError("Bucket");
      }

      const minioBucketName = `${projectId}-${bucketName}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");

      // Verify the file exists
      try {
        await fastify.minio.statObject(minioBucketName, filePath);
      } catch {
        throw new NotFoundError("File");
      }

      // Generate presigned URL
      const clampedExpiry = Math.min(
        Math.max(expiresIn, 60), // min 1 minute
        7 * 24 * 3600 // max 7 days
      );

      const signedUrl = await fastify.minio.presignedGetObject(
        minioBucketName,
        filePath,
        clampedExpiry
      );

      reply.send({
        data: {
          signed_url: signedUrl,
          path: filePath,
          bucket: bucketName,
          expires_in: clampedExpiry,
          expires_at: new Date(
            Date.now() + clampedExpiry * 1000
          ).toISOString(),
        },
        status: 200,
      });
    }
  );
}
