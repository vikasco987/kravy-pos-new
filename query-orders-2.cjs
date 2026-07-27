const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      total: {
        gte: 4000,
        lte: 5000
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Orders with total between 4000 and 5000:");
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, KOT: ${o.kotNumbers}, Date: ${o.createdAt}, User: ${o.clerkUserId}`);
  });
  
  // also let's just get the last 5 orders for ANY user
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("\nLast 5 orders globally:");
  recentOrders.forEach(o => {
    console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, KOT: ${o.kotNumbers}, Date: ${o.createdAt}, User: ${o.clerkUserId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
