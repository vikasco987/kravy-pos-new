const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allOrdersWith4631 = await prisma.order.findMany({
    where: { total: 4631 },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Found ${allOrdersWith4631.length} orders with total 4631:`);
  for (const o of allOrdersWith4631) {
      console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, Date: ${o.createdAt}`);
  }
}

main().finally(() => prisma.$disconnect());
