const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, billNumber: 'INV/2607/0003' },
    select: { id: true, billNumber: true, isDeleted: true, tokenNumber: true }
  });
  console.log(bills);
}
main().finally(() => prisma.$disconnect());
