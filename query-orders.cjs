const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      total: {
        gte: 4630,
        lte: 4632
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Orders with total ~4631:");
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, KOT: ${o.kotNumbers}, Date: ${o.createdAt}, User: ${o.clerkUserId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
