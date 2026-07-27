const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = "user_3D50GqQtgxSAM58kGTRwzdUk3Xc";
  const orders = await prisma.order.findMany({
    where: {
      clerkUserId: clerkId,
      createdAt: {
        gte: new Date('2026-07-20T00:00:00Z'),
        lte: new Date('2026-07-23T00:00:00Z')
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${orders.length} orders for user between Jul 20 and Jul 22:`);
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, Date: ${o.createdAt}`);
  });
}

main().finally(() => prisma.$disconnect());
