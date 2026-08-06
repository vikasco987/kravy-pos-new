import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  
  // June 30 IST
  const startIST1 = new Date("2026-06-29T18:30:00.000Z");
  const endIST1 = new Date("2026-06-30T18:29:59.999Z");

  const billsJune = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST1, lte: endIST1 }, isDeleted: false }
  });
  console.log("June 30th:", billsJune.reduce((s, b) => s + b.total, 0));

  // August 1st IST
  const startIST2 = new Date("2026-07-31T18:30:00.000Z");
  const endIST2 = new Date("2026-08-01T18:29:59.999Z");

  const billsAug = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST2, lte: endIST2 }, isDeleted: false }
  });
  console.log("August 1st:", billsAug.reduce((s, b) => s + b.total, 0));
}

main().finally(() => prisma.$disconnect());
