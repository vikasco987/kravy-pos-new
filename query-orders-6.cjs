const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  let found = null;
  for (const o of allOrders) {
    if (o.total > 4600 && o.total < 4700) {
      console.log(`Found by total: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}`);
    }
    if (Array.isArray(o.items) && o.items.length === 9) {
      console.log(`Found 9 items: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, Date: ${o.createdAt}`);
      found = o;
    }
  }
}

main().finally(() => prisma.$disconnect());
