const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'mahajanraghav14@gmail.com', mode: 'insensitive' } }
  });
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: user.clerkId, createdAt: { gte: today } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, billNumber: true, isDeleted: true, createdAt: true }
  });
  console.log("All Bills Today:");
  bills.forEach(b => console.log(`${b.id} | ${b.billNumber} | ${b.isDeleted ? 'DELETED' : 'ACTIVE'} | ${b.createdAt}`));
}
main().finally(() => prisma.$disconnect());
