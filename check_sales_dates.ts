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
  
  // Group by date
  const byDate: Record<string, number> = {};
  for(const b of bills) {
      // get IST date string
      const date = new Date(b.createdAt.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + b.total;
  }
  
  const sortedDates = Object.keys(byDate).sort();
  for(const d of sortedDates) {
      console.log(`${d}: ${byDate[d]}`);
  }
}

main().finally(() => prisma.$disconnect());
