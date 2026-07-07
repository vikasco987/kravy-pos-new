const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' },
    select: { billNumber: true, subtotal: true, tax: true, total: true, items: true }
  });
  console.log(JSON.stringify(bills, null, 2));
}
main().finally(() => prisma.$disconnect());
