import 'dotenv/config';
/**
 * Vorebase Realtime Service — Server Bootstrap
 *
 * WebSocket server that pushes database change events to connected clients.
 *
 * Connection flow:
 * 1. Client connects: ws://host:4004/realtime/v1?token=<JWT>
 * 2. Server verifies JWT, registers client
 * 3. Client sends subscribe messages for channels
 * 4. CDC poller detects changes → broadcasts to subscribers
 *
 * Port: 4004
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

import {
  PORTS,
  AppError,
  createLogger,
  verifyToken,
  extractBearerToken,
} from "@repo/common";
import type { JwtPayload, AdminJwtPayload } from "@repo/common";

import { channelManager } from "./channels/manager.js";
import { handleMessage } from "./channels/handler.js";
import { startPoller, stopPoller } from "./cdc/mysql-poller.js";

const logger = createLogger("ws-server");

async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }

  // ── Plugins ──────────────────────────────────────────
  await app.register(cors, { origin: true });
  await app.register(websocket);

  // ── WebSocket Route ──────────────────────────────────
  app.get(
    "/realtime/v1",
    { websocket: true },
    (socket, request) => {
      // Authenticate via query parameter token
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token =
        url.searchParams.get("token") ||
        extractBearerToken(request.headers.authorization);

      if (!token) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Authentication required. Pass ?token=<JWT>",
          })
        );
        socket.close(4001, "Authentication required");
        return;
      }

      // Verify JWT
      let payload: JwtPayload;
      try {
        payload = verifyToken<JwtPayload>(token, jwtSecret);
      } catch {
        try {
          // Try as admin token
          const adminPayload = verifyToken<AdminJwtPayload>(token, jwtSecret);
          payload = {
            sub: adminPayload.sub,
            email: adminPayload.email,
            role: "service_role",
            project_id: url.searchParams.get("projectId") || "",
            iat: adminPayload.iat,
            exp: adminPayload.exp,
          };
        } catch {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Invalid or expired token",
            })
          );
          socket.close(4001, "Invalid token");
          return;
        }
      }

      // Register client
      const clientId = channelManager.addClient(
        socket,
        payload.sub,
        payload.role,
        payload.project_id
      );

      // Send welcome message
      socket.send(
        JSON.stringify({
          type: "connected",
          client_id: clientId,
          message: "Connected to Vorebase Realtime",
          timestamp: new Date().toISOString(),
        })
      );

      // Handle incoming messages
      socket.on("message", (data: Buffer) => {
        try {
          handleMessage(clientId, socket, data.toString());
        } catch (err) {
          logger.error({ err, clientId }, "Error handling message");
        }
      });

      // Handle disconnect
      socket.on("close", () => {
        channelManager.removeClient(clientId);
      });

      // Handle errors
      socket.on("error", (err: Error) => {
        logger.error({ err, clientId }, "WebSocket error");
        channelManager.removeClient(clientId);
      });

      // Heartbeat — send ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      socket.on("close", () => {
        clearInterval(pingInterval);
      });
    }
  );

  // ── Health Check ──────────────────────────────────────
  app.get("/realtime/v1/health", async () => {
    return {
      status: "ok",
      service: "ws-server",
      connected_clients: channelManager.getClientCount(),
      active_subscriptions: channelManager.getSubscriptionCount(),
      timestamp: new Date().toISOString(),
    };
  });

  // ── Error Handler ────────────────────────────────────
  app.setErrorHandler((error: import("fastify").FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
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

  // ── Lifecycle Hooks ──────────────────────────────────
  app.addHook("onReady", async () => {
    // Start the CDC poller once the server is ready
    startPoller();
  });

  app.addHook("onClose", async () => {
    stopPoller();
  });

  return app;
}

// ── Start Server ──────────────────────────────────────────
async function main() {
  try {
    const app = await buildApp();
    const port = PORTS.WS_SERVICE;

    await app.listen({ port, host: "0.0.0.0" });
    logger.info(`Realtime service listening on port ${port}`);
  } catch (err) {
    logger.error({ err }, "Failed to start realtime service");
    process.exit(1);
  }
}

main();
