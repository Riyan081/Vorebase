/**
 * Vorebase REST API — Dynamic Database Connection Pool
 *
 * Manages mysql2 connection pools per project database.
 * Each project has its own MySQL database (e.g., "vorebase_proj_abc123"),
 * and this plugin provides a pool for querying it.
 *
 * Pools are cached and reused across requests to the same project.
 * On shutdown, all pools are gracefully closed.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import { prismaClient } from "@repo/db/client";
import { NotFoundError, createLogger } from "@repo/common";

const logger = createLogger("db-connection");

// Cache of connection pools keyed by project database name
const poolCache = new Map<string, Pool>();

/**
 * Get or create a mysql2 connection pool for a project's database.
 */
function getPool(databaseName: string): Pool {
  let pool = poolCache.get(databaseName);
  if (pool) return pool;

  // Parse the base DATABASE_URL and replace the database name
  const baseUrl = process.env.DATABASE_URL!;
  const url = new URL(baseUrl);

  pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || "3306", 10),
    user: url.username,
    password: url.password,
    database: databaseName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Enable named placeholders for complex queries
    namedPlaceholders: false,
  });

  poolCache.set(databaseName, pool);
  logger.info({ databaseName }, "Created connection pool");

  return pool;
}

/**
 * Helper to get a pool by project ID.
 */
async function getProjectPool(projectId: string): Promise<{ pool: Pool; dbName: string }> {
  const project = await prismaClient.project.findUnique({
    where: { id: projectId },
    select: { dbName: true },
  });

  if (!project) {
    throw new NotFoundError("Project");
  }

  return { pool: getPool(project.dbName), dbName: project.dbName };
}

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    jwtSecret: string;
    /**
     * preHandler: authenticate then attach the project DB pool.
     * Use this instead of [authenticateRequest] on routes that need DB access.
     */
    authenticateAndAttachDb: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    /** mysql2 connection pool for the current project's database */
    dbPool?: Pool;
    /** The project's database name */
    dbName?: string;
  }
}

async function dbConnectionPluginFn(fastify: FastifyInstance) {
  fastify.decorate(
    "authenticateAndAttachDb",
    async function (request: FastifyRequest, reply: FastifyReply) {
      // 1. Authenticate (sets request.projectId)
      await (fastify as any).authenticateRequest(request, reply);

      const projectId = request.projectId;
      if (!projectId) return; // health checks / no-project routes

      // 2. Look up the project database name
      const project = await prismaClient.project.findUnique({
        where: { id: projectId },
        select: { dbName: true },
      });

      if (!project) {
        throw new NotFoundError("Project");
      }

      request.dbPool = getPool(project.dbName);
      request.dbName = project.dbName;
    }
  );

  // Clean up all pools on server shutdown
  fastify.addHook("onClose", async () => {
    logger.info("Closing all database connection pools...");
    const closePromises: Promise<void>[] = [];

    for (const [name, pool] of poolCache) {
      closePromises.push(
        pool
          .end()
          .then(() => logger.info({ databaseName: name }, "Pool closed"))
          .catch((err) =>
            logger.error({ err, databaseName: name }, "Error closing pool")
          )
      );
    }

    await Promise.all(closePromises);
    poolCache.clear();
  });
}

export const dbConnectionPlugin = fp(dbConnectionPluginFn, {
  name: "db-connection-plugin",
  dependencies: ["jwt-plugin"],
});
