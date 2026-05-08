// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma_v7: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma_v7 ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_v7 = prisma;
}

export default prisma;
// Forced reload for Inventory & Recipe at Sat May 9 02:05:00 IST 2026
