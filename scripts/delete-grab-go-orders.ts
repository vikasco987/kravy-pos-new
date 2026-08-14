import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clerkId = 'user_38JzWoY3MylkjfWaASjmKeFbSQW';
  
  const targetSuffixes = [
    '7b8d', '4d99', '45a0', '0f3f', '5034', '9e6c', '37b3', '944d',
    'a659', 'abe8', '203d', 'b816', '7d73', '53ef', '768c', '071f',
    'a36e', '9130', '73cd', '103d'
  ];

  const allPreparing = await prisma.order.findMany({
    where: { clerkUserId: clerkId, status: 'PREPARING' }
  });

  const matchedOrders = allPreparing.filter(o => 
    targetSuffixes.some(suffix => o.id.endsWith(suffix))
  );

  let deletedCount = 0;
  for (const order of matchedOrders) {
    await prisma.order.delete({
      where: { id: order.id }
    });
    console.log(`Deleted Order ID: ${order.id}`);
    deletedCount++;
  }

  console.log(`Successfully deleted ${deletedCount} orders.`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
