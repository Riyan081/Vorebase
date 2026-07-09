/**
 * Vorebase Auth Service — Request Validation Schemas
 *
 * Fastify JSON Schema validation for all auth endpoints.
 * These run BEFORE the route handler — invalid requests are
 * rejected with a 400 before they hit any business logic.
 */

export const signupSchema = {
  body: {
    type: "object" as const,
    required: ["email", "password"],
    properties: {
      email: {
        type: "string" as const,
        format: "email",
        maxLength: 255,
      },
      password: {
        type: "string" as const,
        minLength: 8,
        maxLength: 128,
      },
      projectId: {
        type: "string" as const,
        format: "uuid",
      },
    },
    additionalProperties: false,
  },
};

export const signinSchema = {
  body: {
    type: "object" as const,
    required: ["email", "password"],
    properties: {
      email: {
        type: "string" as const,
        format: "email",
        maxLength: 255,
      },
      password: {
        type: "string" as const,
        minLength: 1,
        maxLength: 128,
      },
      projectId: {
        type: "string" as const,
        format: "uuid",
      },
    },
    additionalProperties: false,
  },
};

export const refreshSchema = {
  body: {
    type: "object" as const,
    required: ["refresh_token"],
    properties: {
      refresh_token: {
        type: "string" as const,
        minLength: 1,
      },
    },
    additionalProperties: false,
  },
};

export const updateUserSchema = {
  body: {
    type: "object" as const,
    properties: {
      email: {
        type: "string" as const,
        format: "email",
        maxLength: 255,
      },
      password: {
        type: "string" as const,
        minLength: 8,
        maxLength: 128,
      },
      metadata: {
        type: "object" as const,
      },
    },
    additionalProperties: false,
  },
};

export const adminCreateUserSchema = {
  body: {
    type: "object" as const,
    required: ["email", "password", "projectId"],
    properties: {
      email: {
        type: "string" as const,
        format: "email",
        maxLength: 255,
      },
      password: {
        type: "string" as const,
        minLength: 8,
        maxLength: 128,
      },
      projectId: {
        type: "string" as const,
        format: "uuid",
      },
      role: {
        type: "string" as const,
        enum: ["authenticated"],
      },
      autoConfirm: {
        type: "boolean" as const,
      },
    },
    additionalProperties: false,
  },
};

export const createApiKeySchema = {
  body: {
    type: "object" as const,
    required: ["name", "projectId"],
    properties: {
      name: {
        type: "string" as const,
        enum: ["anon", "service_role"],
      },
      projectId: {
        type: "string" as const,
        format: "uuid",
      },
    },
    additionalProperties: false,
  },
};
