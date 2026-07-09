/**
 * Vorebase Auth Service — JWT Plugin
 *
 * Fastify plugin that adds JWT sign/verify as decorators
 * so route handlers can easily work with tokens.
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  signAccessToken,
  signAdminAccessToken,
  signRefreshToken,
  verifyToken,
  extractBearerToken,
} from "@repo/common";
import type { JwtPayload, AdminJwtPayload } from "@repo/common";

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    jwtSecret: string;
    signUserToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
    signAdminToken: (
      payload: Omit<AdminJwtPayload, "iat" | "exp">
    ) => string;
    signRefresh: (sub: string) => string;
    verifyUserToken: (token: string) => JwtPayload;
    verifyAdminToken: (token: string) => AdminJwtPayload;
  }

  interface FastifyRequest {
    /** The authenticated user's JWT payload (set by auth-guard) */
    user?: JwtPayload | AdminJwtPayload;
  }
}

export async function jwtPlugin(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be set and at least 32 characters long"
    );
  }

  // Store the secret on the instance
  fastify.decorate("jwtSecret", secret);

  // Sign a user access token
  fastify.decorate(
    "signUserToken",
    (payload: Omit<JwtPayload, "iat" | "exp">) => {
      return signAccessToken(payload, secret);
    }
  );

  // Sign an admin access token
  fastify.decorate(
    "signAdminToken",
    (payload: Omit<AdminJwtPayload, "iat" | "exp">) => {
      return signAdminAccessToken(payload, secret);
    }
  );

  // Sign a refresh token
  fastify.decorate("signRefresh", (sub: string) => {
    return signRefreshToken({ sub, type: "refresh" }, secret);
  });

  // Verify a user token
  fastify.decorate("verifyUserToken", (token: string) => {
    return verifyToken<JwtPayload>(token, secret);
  });

  // Verify an admin token
  fastify.decorate("verifyAdminToken", (token: string) => {
    return verifyToken<AdminJwtPayload>(token, secret);
  });
}
