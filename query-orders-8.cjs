const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = "user_3D50GqQtgxSAM58kGTRwzdUk3Xc";
  const orders = await prisma.order.findMany({
    where: { clerkUserId: clerkId },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  console.log("Recent orders for user:");
  orders.forEach(o => {
    let numItems = Array.isArray(o.items) ? o.items.length : 0;
    console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, Items: ${numItems}, Date: ${o.createdAt}`);
  });
}

main().finally(() => prisma.$disconnect());
