import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'mahajan', mode: 'insensitive' } }
  });
  console.log("Users:", users.map(u => ({ id: u.id, clerkId: u.clerkId, email: u.email })));

  if (users.length > 0) {
    const clerkId = users[0].clerkId;
    const orders = await prisma.order.findMany({
      where: {
        clerkUserId: clerkId,
        total: 4631
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log("Orders with total 4631:");
    orders.forEach(o => {
      console.log(`ID: ${o.id}, Token: ${o.tokenNumber}, KOT: ${o.kotNumbers}, Date: ${o.createdAt}, Status: ${o.status}`);
    });
    
    // Also fetch the latest 10 orders to see the token sequence
    const latestOrders = await prisma.order.findMany({
      where: { clerkUserId: clerkId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log("\nLatest 10 orders:");
    latestOrders.forEach(o => {
      console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, KOT: ${o.kotNumbers}, Date: ${o.createdAt}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
