/**
 * Vorebase REST API Service — Server Bootstrap
 *
 * Entry point for the auto-REST API microservice.
 * Compiles URL query parameters into MySQL queries and
 * enforces Virtual RLS policies.
 *
 * Port: 4002
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import {
  PORTS,
  RATE_LIMITS,
  AppError,
  createLogger,
} from "@repo/common";

// Plugins
import { jwtPlugin } from "./plugins/jwt.js";
import { dbConnectionPlugin } from "./plugins/db-connection.js";

// Routes
import { tableRoutes } from "./routes/tables.js";
import { schemaRoutes } from "./routes/schema.js";
import { rpcRoutes } from "./routes/rpc.js";
import { rlsManagementRoutes } from "./routes/rls-management.js";
import { sqlRoutes } from "./routes/sql.js";
import { tableDdlRoutes } from "./routes/table-ddl.js";

const logger = createLogger("rest-service");

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

  // ── Core Plugins ──────────────────────────────────────
  await app.register(jwtPlugin);
  await app.register(dbConnectionPlugin);

  // ── Routes ────────────────────────────────────────────
  // Schema introspection (must be registered BEFORE dynamic table routes)
  await app.register(schemaRoutes);

  // RLS policy management
  await app.register(rlsManagementRoutes);

  // Raw SQL execution (for SQL Editor)
  await app.register(sqlRoutes);

  // Table DDL management (CREATE/DROP/ALTER)
  await app.register(tableDdlRoutes);

  // RPC (stored procedures)
  await app.register(rpcRoutes);

  // Dynamic CRUD — this has wildcard /:table, so register LAST
  await app.register(tableRoutes);

  // ── Health Check ──────────────────────────────────────
  app.get("/rest/v1/health", async () => {
    return {
      status: "ok",
      service: "rest-service",
      timestamp: new Date().toISOString(),
    };
  });

  // ── Global Error Handler ──────────────────────────────
  app.setErrorHandler((error, request, reply) => {
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

    // SQL errors — return generic message, log details
    if ((error as any).code?.startsWith?.("ER_")) {
      logger.error({ err: error, url: request.url }, "MySQL error");
      return reply.status(400).send({
        error: {
          message: "Database query error",
          code: (error as any).code,
          details: null,
          hint: null,
        },
        status: 400,
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
    const port = PORTS.REST_SERVICE;

    await app.listen({ port, host: "0.0.0.0" });
    logger.info(`REST API service listening on port ${port}`);
  } catch (err) {
    logger.error({ err }, "Failed to start REST API service");
    process.exit(1);
  }
}

main();
