import { PrismaClient } from '@prisma/client';
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
  if (parties.length > 0) {
    console.log(parties.slice(0, 5));
  }

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
  if (orders.length > 0) {
    console.log(orders.slice(0, 5));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
