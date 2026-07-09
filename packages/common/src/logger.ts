/**
 * Vorebase — Pino Logger
 *
 * Structured JSON logging with sensitive field redaction.
 * All services use this logger instead of console.log.
 *
 * SECURITY: Automatically redacts passwords, tokens, and auth headers
 * so they never appear in log output.
 */

import pino from "pino";

/**
 * Creates a configured Pino logger instance for a service.
 *
 * @param serviceName - Name of the service (e.g., "auth-service")
 * @returns Configured Pino logger
 */
export function createLogger(serviceName: string) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || "info",

    // Redact sensitive fields so they never appear in logs
    redact: {
      paths: [
        "password",
        "req.headers.authorization",
        "req.headers.apikey",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "*.password",
        "*.token",
        "*.secret",
      ],
      censor: "[REDACTED]",
    },

    // Human-readable in dev, JSON in production
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino/file",
            options: { destination: 1 }, // stdout
          }
        : undefined,

    // Add timestamp in ISO format
    timestamp: pino.stdTimeFunctions.isoTime,

    // Base fields added to every log line
    base: {
      service: serviceName,
      pid: process.pid,
    },

    // Serializers for common objects
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
      err: pino.stdSerializers.err,
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;
