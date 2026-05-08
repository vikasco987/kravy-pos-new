// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma_v6: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma_v6 ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_v6 = prisma;
}

export default prisma;
// Forced reload for reviewUrl at Fri May 8 21:02:00 IST 2026
