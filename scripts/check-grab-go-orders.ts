import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: { contains: 'Grab', mode: 'insensitive' }
    }
  });

  console.log('Users found:', users.map(u => `${u.name} (${u.email}) - clerkId: ${u.clerkId}`));
  
  if (users.length === 0) return;

  const clerkId = users[0].clerkId;
  
  const orders = await prisma.order.findMany({
    where: { clerkUserId: clerkId, status: 'PREPARING' }
  });

  console.log(`Found ${orders.length} orders in PREPARING status`);
  
  if (orders.length > 0) {
    console.log("Sample order IDs:", orders.slice(0, 5).map(o => ({ id: o.id, orderNumber: o.orderNumber })));
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
