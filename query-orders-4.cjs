const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { total: 809 },
        { total: 4631 },
        { total: 452 },
        { total: 494 },
        { total: 499 }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Found orders:");
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Total: ${o.total}, Cust: ${o.customerName}, Phone: ${o.customerPhone}, Date: ${o.createdAt}, User: ${o.clerkUserId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
