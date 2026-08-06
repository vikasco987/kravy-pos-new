import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  const startIST = new Date("2026-06-30T18:30:00.000Z");
  const endIST = new Date("2026-07-31T18:29:59.999Z");

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST }, isDeleted: false }
  });
  
  const cancelled = bills.filter(b => b.paymentStatus.toUpperCase() === "CANCELLED");
  console.log("Cancelled Bills Sum:", cancelled.reduce((s, b) => s + b.total, 0));
  
  const nonCancelled = bills.filter(b => b.paymentStatus.toUpperCase() !== "CANCELLED");
  console.log("Non-Cancelled Bills Sum:", nonCancelled.reduce((s, b) => s + b.total, 0));
}

main().finally(() => prisma.$disconnect());
