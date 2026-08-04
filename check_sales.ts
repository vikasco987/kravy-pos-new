import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = "Mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });
  
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("Found user with clerkId:", user.clerkId);
  
  const startRange = new Date(Date.UTC(2026, 7, 3, 0, 0, 0, 0));
  startRange.setMinutes(startRange.getMinutes() - 330);

  const endRange = new Date(Date.UTC(2026, 7, 3, 23, 59, 59, 999));
  endRange.setMinutes(endRange.getMinutes() - 330);
  
  console.log("Querying bills between:", startRange.toISOString(), "and", endRange.toISOString());
  
  const bills = await prisma.billManager.findMany({
    where: {
      clerkUserId: user.clerkId,
      isDeleted: false,
      createdAt: { gte: startRange, lte: endRange }
    }
  });
  
  const externalSales = await prisma.externalSales.findMany({
    where: {
      clerkUserId: user.clerkId,
      date: { gte: startRange, lte: endRange }
    }
  });
  
  const offlineRevenue = bills.reduce((sum, b) => sum + (b.total || 0), 0);
  const externalRevenue = externalSales.reduce((sum, x) => sum + (x.totalRevenue || 0), 0);
  const totalRevenue = offlineRevenue + externalRevenue;
  
  console.log(`Total Bills: ${bills.length}`);
  console.log(`Offline Revenue: Rs. ${offlineRevenue}`);
  console.log(`External Revenue: Rs. ${externalRevenue}`);
  console.log(`Total Revenue: Rs. ${totalRevenue}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
