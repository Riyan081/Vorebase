/**
 * Vorebase REST API — Virtual RLS (Row Level Security) Plugin
 *
 * Implements application-layer row-level security for MySQL.
 * Since MySQL doesn't have native RLS like PostgreSQL, we inject
 * WHERE clauses based on policies defined in the RlsPolicy table.
 *
 * How it works:
 * 1. Look up policies for the requested table + project
 * 2. Filter by operation (SELECT/INSERT/UPDATE/DELETE) and user role
 * 3. Evaluate policy expressions (e.g., user_id = auth.uid())
 * 4. Return additional WHERE conditions to inject into the query
 *
 * SECURITY:
 * - service_role bypasses ALL RLS policies
 * - anon role: only policies with "anon" in their roles apply
 * - auth.uid() is replaced with the JWT sub (user ID)
 * - Policies use parameterized values (no interpolation)
 */

import type { FastifyInstance } from "fastify";
import { prismaClient } from "@repo/db/client";
import {
  ROLES,
  RlsViolationError,
} from "@repo/common";
import type { RlsPolicyCheck, JwtPayload } from "@repo/common";
import { escapeIdentifier } from "../utils/sanitize.js";

export interface RlsResult {
  /** Additional WHERE clause SQL to inject */
  sql: string;
  /** Parameters for the WHERE clause */
  params: unknown[];
  /** Whether RLS is bypassed (service_role) */
  bypassed: boolean;
}

/**
 * Evaluate RLS policies for a given request context.
 *
 * @param projectId - The project ID
 * @param tableName - The table being accessed
 * @param operation - The SQL operation (SELECT, INSERT, UPDATE, DELETE)
 * @param user - The authenticated user's JWT payload
 * @returns RLS result with WHERE conditions to inject
 */
export async function evaluateRls(
  projectId: string,
  tableName: string,
  operation: string,
  user?: JwtPayload
): Promise<RlsResult> {
  // service_role bypasses ALL RLS
  if (user && user.role === ROLES.SERVICE_ROLE) {
    return { sql: "", params: [], bypassed: true };
  }

  // Look up active policies for this table + project
  const policies = await prismaClient.rlsPolicy.findMany({
    where: {
      projectId,
      tableName,
      isEnabled: true,
      OR: [
        { operation: operation.toUpperCase() },
        { operation: "ALL" },
      ],
    },
  });

  // If no policies exist, allow access (open by default)
  // In a stricter mode, you could deny by default
  if (policies.length === 0) {
    return { sql: "", params: [], bypassed: false };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];

  for (const policy of policies) {
    // Check if this policy applies to the user's role
    const policyRoles = policy.roles as string[];
    const userRole = user?.role || ROLES.ANON;

    if (!policyRoles.includes(userRole)) {
      continue;
    }

    // Parse the policy check expression
    const check = policy.check as RlsPolicyCheck;

    if (!check || !check.column || !check.op) {
      continue;
    }

    const column = escapeIdentifier(check.column);

    // Resolve special values
    let resolvedValue: string | null = check.value;

    if (resolvedValue === "auth.uid()") {
      // Replace with the authenticated user's ID
      if (!user || !user.sub) {
        // If no user and policy requires auth.uid(), deny access
        throw new RlsViolationError();
      }
      resolvedValue = user.sub;
    }

    // Build the condition
    switch (check.op) {
      case "eq":
        conditions.push(`${column} = ?`);
        params.push(resolvedValue);
        break;
      case "neq":
        conditions.push(`${column} != ?`);
        params.push(resolvedValue);
        break;
      case "gt":
        conditions.push(`${column} > ?`);
        params.push(resolvedValue);
        break;
      case "gte":
        conditions.push(`${column} >= ?`);
        params.push(resolvedValue);
        break;
      case "lt":
        conditions.push(`${column} < ?`);
        params.push(resolvedValue);
        break;
      case "lte":
        conditions.push(`${column} <= ?`);
        params.push(resolvedValue);
        break;
      case "is":
        if (resolvedValue === "null" || resolvedValue === null) {
          conditions.push(`${column} IS NULL`);
        } else if (resolvedValue === "true") {
          conditions.push(`${column} IS TRUE`);
        } else if (resolvedValue === "false") {
          conditions.push(`${column} IS FALSE`);
        }
        break;
      default:
        // Unknown operator — skip
        break;
    }
  }

  // If policies exist but none generated conditions for this role, deny access
  // (policies exist but don't apply to this user = access denied)
  const applicablePolicies = policies.filter((p) => {
    const roles = p.roles as string[];
    const userRole = user?.role || ROLES.ANON;
    return roles.includes(userRole);
  });

  if (applicablePolicies.length > 0 && conditions.length === 0) {
    throw new RlsViolationError();
  }

  return {
    sql: conditions.join(" AND "),
    params,
    bypassed: false,
  };
}
