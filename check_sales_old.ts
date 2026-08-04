import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = "Mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });
  
  if (!user) return;
  
  // This simulates what new Date("2026-08-03").setHours(0,0,0,0) does in UTC on Vercel
  const startRange = new Date(Date.UTC(2026, 7, 3, 0, 0, 0, 0));
  const endRange = new Date(Date.UTC(2026, 7, 3, 23, 59, 59, 999));
  
  console.log("OLD Querying bills between:", startRange.toISOString(), "and", endRange.toISOString());
  
  const bills = await prisma.billManager.findMany({
    where: {
      clerkUserId: user.clerkId,
      isDeleted: false,
      createdAt: { gte: startRange, lte: endRange }
    }
  });
  
  const offlineRevenue = bills.reduce((sum, b) => sum + (b.total || 0), 0);
  console.log(`OLD Total Bills: ${bills.length}`);
  console.log(`OLD Offline Revenue: Rs. ${offlineRevenue}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
