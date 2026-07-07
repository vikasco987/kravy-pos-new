const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: today } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, billNumber: true, isDeleted: true, tokenNumber: true, createdAt: true }
  });
  console.log("All Bills Today for clerk:");
  bills.forEach(b => console.log(`${b.id} | ${b.billNumber} | Token: ${b.tokenNumber} | ${b.isDeleted ? 'DELETED' : 'ACTIVE'} | ${b.createdAt}`));
}
main().finally(() => prisma.$disconnect());
