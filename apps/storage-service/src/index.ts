import 'dotenv/config';
/**
 * Vorebase Storage Service — Server Bootstrap
 *
 * Entry point for the file storage microservice.
 * Handles file uploads, downloads, and bucket management via MinIO.
 *
 * Port: 4003
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";

import {
  PORTS,
  RATE_LIMITS,
  STORAGE,
  AppError,
  createLogger,
} from "@repo/common";

// Plugins
import { jwtPlugin } from "./plugins/jwt.js";
import { minioPlugin } from "./plugins/minio.js";

// Routes
import { bucketRoutes } from "./routes/buckets.js";
import { objectRoutes } from "./routes/objects.js";
import { signedUrlRoutes } from "./routes/signed-url.js";

const logger = createLogger("storage-service");

async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // ── Security Plugins ──────────────────────────────────
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: RATE_LIMITS.API_MAX_PER_MINUTE,
    timeWindow: "1 minute",
  });

  // ── Multipart (File Uploads) ──────────────────────────
  await app.register(multipart, {
    limits: {
      fileSize: STORAGE.DEFAULT_MAX_FILE_SIZE, // 50MB default
    },
  });

  // ── Core Plugins ──────────────────────────────────────
  await app.register(jwtPlugin);
  await app.register(minioPlugin);

  // ── Routes ────────────────────────────────────────────
  // Signed URLs must be registered BEFORE objects (both use /storage/v1/object/)
  await app.register(signedUrlRoutes);
  await app.register(bucketRoutes);
  await app.register(objectRoutes);

  // ── Health Check ──────────────────────────────────────
  app.get("/storage/v1/health", async () => {
    return {
      status: "ok",
      service: "storage-service",
      timestamp: new Date().toISOString(),
    };
  });

  // ── Global Error Handler ──────────────────────────────
  app.setErrorHandler((error: import("fastify").FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }

    if (error.validation) {
      return reply.status(400).send({
        error: {
          message: error.message,
          code: "VALIDATION_ERROR",
          details: error.validation,
          hint: null,
        },
        status: 400,
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: {
          message: "Too many requests. Please try again later.",
          code: "RATE_LIMIT",
          details: null,
          hint: null,
        },
        status: 429,
      });
    }

    logger.error({ err: error, url: request.url }, "Unhandled error");
    return reply.status(500).send({
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
        details: null,
        hint: null,
      },
      status: 500,
    });
  });

  return app;
}

// ── Start Server ──────────────────────────────────────────
async function main() {
  try {
    const app = await buildApp();
    const port = PORTS.STORAGE_SERVICE;

    await app.listen({ port, host: "0.0.0.0" });
    logger.info(`Storage service listening on port ${port}`);
  } catch (err) {
    logger.error({ err }, "Failed to start storage service");
    process.exit(1);
  }
}

main();
