/**
 * Vorebase Storage Service — MinIO Client Plugin
 *
 * Initializes the MinIO client and decorates the Fastify instance.
 * MinIO is an S3-compatible object storage server.
 *
 * All file I/O goes through this client — Fastify never holds
 * files in memory; it streams directly to/from MinIO.
 */

import type { FastifyInstance } from "fastify";
import * as Minio from "minio";
import { createLogger } from "@repo/common";

const logger = createLogger("minio-plugin");

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    minio: Minio.Client;
  }
}

export async function minioPlugin(fastify: FastifyInstance) {
  const endPoint = process.env.MINIO_ENDPOINT || "localhost";
  const port = parseInt(process.env.MINIO_PORT || "9000", 10);
  const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
  const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
  const useSSL = process.env.MINIO_USE_SSL === "true";

  const client = new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });

  // Verify connection by listing buckets
  try {
    await client.listBuckets();
    logger.info(
      { endPoint, port },
      "MinIO connection established"
    );
  } catch (err) {
    logger.error({ err }, "Failed to connect to MinIO");
    throw new Error("Cannot connect to MinIO storage backend");
  }

  fastify.decorate("minio", client);
}
