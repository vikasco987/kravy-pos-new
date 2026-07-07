const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bills = await prisma.billManager.findMany({
    where: { total: 1060 }
  });
  console.log("Found bills with total 1060:");
  for (let b of bills) {
     console.log(b.id, b.billNumber, b.clerkUserId, b.createdAt);
  }
}
main().finally(() => prisma.$disconnect());
