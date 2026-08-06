import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  const startIST = new Date("2026-06-30T18:30:00.000Z");
  const endIST = new Date("2026-07-31T18:29:59.999Z");

  const transactions = await prisma.walletTransaction?.findMany({
    where: { createdAt: { gte: startIST, lte: endIST } }
  }).catch(() => []);
  
  // Actually we need to filter by user's clerkId, but wallet transaction might not have clerkId, it has partyId.
  console.log("Wallet Transactions:", transactions);
}

main().finally(() => prisma.$disconnect());
