const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const parties = await prisma.party.findMany({
    where: {
      address: {
        contains: 'Maharash',
        mode: 'insensitive'
      }
    }
  });
  console.log(`Parties from Maharashtra: ${parties.length}`);

  const orders = await prisma.order.findMany({
    where: {
      customerAddress: {
        contains: 'Maharash',
        mode: 'insensitive'
      }
    },
    distinct: ['customerPhone'],
    select: {
      customerName: true,
      customerPhone: true,
      customerAddress: true
    }
  });
  console.log(`Unique Customers from orders with Maharashtra address: ${orders.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
