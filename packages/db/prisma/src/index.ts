import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prismaClient: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

// Re-export Prisma types for use in other packages
export { PrismaClient };
export type {
  AdminUser,
  Project,
  ApiKey,
  User,
  RefreshToken,
  StorageBucket,
  StorageObject,
  RlsPolicy,
  ChangeEvent,
} from "@prisma/client";