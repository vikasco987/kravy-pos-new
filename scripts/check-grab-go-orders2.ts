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

  console.log(`Total PREPARING orders: ${allPreparing.length}`);
  console.log(`Matched orders from list: ${matchedOrders.length}`);
  
  const unmatchedTargetSuffixes = targetSuffixes.filter(suffix => 
    !allPreparing.some(o => o.id.endsWith(suffix))
  );
  console.log(`Unmatched target suffixes:`, unmatchedTargetSuffixes);

  // Check if there are other PREPARING orders not in the list
  const otherPreparing = allPreparing.filter(o => 
    !targetSuffixes.some(suffix => o.id.endsWith(suffix))
  );
  console.log(`Other PREPARING orders not in list: ${otherPreparing.length}`);
  otherPreparing.forEach(o => console.log(o.id));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
