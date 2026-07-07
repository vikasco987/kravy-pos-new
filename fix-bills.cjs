const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: { equals: 'mahajanraghav14@gmail.com', mode: 'insensitive' } },
        { phone: '9888899482' }
      ]
    }
  });
  if (!user) {
    console.log("User not found by email or phone");
    return;
  }
  console.log("User ID:", user.id);
  console.log("Clerk ID:", user.clerkId);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: user.clerkId, createdAt: { gte: today } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, billNumber: true, createdAt: true, isDeleted: true }
  });
  console.log("Bills:", bills.map(b => `${b.id} | ${b.billNumber} | ${b.isDeleted} | ${b.createdAt}`));
}
main().finally(() => prisma.$disconnect());
