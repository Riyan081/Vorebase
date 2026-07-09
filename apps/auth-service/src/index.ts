/**
 * Vorebase Auth Service — Server Bootstrap
 *
 * Entry point for the authentication microservice.
 * Registers all plugins and routes, starts listening on port 4001.
 *
 * Plugin order matters:
 * 1. CORS + Helmet + Rate Limit (security layer)
 * 2. JWT plugin (token signing/verification decorators)
 * 3. Auth guard plugin (requireAuth / requireAdmin decorators)
 * 4. Routes (use the decorators from above)
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { PORTS, RATE_LIMITS, AppError, createLogger } from "@repo/common";

// Plugins
import { jwtPlugin } from "./plugins/jwt.js";
import { authGuardPlugin } from "./plugins/auth-guard.js";

// Routes
import { signupRoute } from "./routes/signup.js";
import { signinRoute } from "./routes/signin.js";
import { signoutRoute } from "./routes/signout.js";
import { refreshRoute } from "./routes/refresh.js";
import { userRoute } from "./routes/user.js";
import { adminAuthRoute } from "./routes/admin/auth.js";
import { adminProjectsRoute } from "./routes/admin/projects.js";
import { adminUsersRoute } from "./routes/admin/users.js";
import { adminKeysRoute } from "./routes/admin/keys.js";

const logger = createLogger("auth-service");

async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // ── Security Plugins ──────────────────────────────────
  await app.register(cors, {
    origin: true, // Allow all origins in dev; lock down in production
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false, // API-only service
  });

  await app.register(rateLimit, {
    max: RATE_LIMITS.AUTH_MAX_PER_MINUTE,
    timeWindow: "1 minute",
    // Override for non-auth routes
    keyGenerator: (request) => {
      return request.ip;
    },
  });

  // ── Core Plugins ──────────────────────────────────────
  await app.register(jwtPlugin);
  await app.register(authGuardPlugin);

  // ── Routes ────────────────────────────────────────────

  // Public auth routes (project-level users)
  await app.register(signupRoute);
  await app.register(signinRoute);
  await app.register(signoutRoute);
  await app.register(refreshRoute);
  await app.register(userRoute);

  // Admin routes (platform-level)
  await app.register(adminAuthRoute);
  await app.register(adminProjectsRoute);
  await app.register(adminUsersRoute);
  await app.register(adminKeysRoute);

  // ── Health Check ──────────────────────────────────────
  app.get("/auth/v1/health", async () => {
    return {
      status: "ok",
      service: "auth-service",
      timestamp: new Date().toISOString(),
    };
  });

  // ── Global Error Handler ──────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    // Handle our custom AppError classes
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }

    // Handle Fastify validation errors
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

    // Handle rate limit errors
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

    // Unknown errors — log full details, return generic message
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
    const port = PORTS.AUTH_SERVICE;

    await app.listen({ port, host: "0.0.0.0" });
    logger.info(`Auth service listening on port ${port}`);
  } catch (err) {
    logger.error({ err }, "Failed to start auth service");
    process.exit(1);
  }
}

main();
