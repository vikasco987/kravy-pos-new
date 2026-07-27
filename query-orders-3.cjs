const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerPhone: { contains: '9855934487' } },
        { customerName: { contains: '3 frds', mode: 'insensitive' } },
        { customerName: { contains: 'Walk', mode: 'insensitive' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Found orders:");
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Total: ${o.total}, Cust: ${o.customerName}, Phone: ${o.customerPhone}, Date: ${o.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
