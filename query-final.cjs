const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = "user_3D50GqQtgxSAM58kGTRwzdUk3Xc";
  
  // Find in Order
  const orders = await prisma.order.findMany({
    where: { clerkUserId: clerkId, total: 4631 }
  });
  console.log(`Found ${orders.length} in Order for 4631`);

  // Find in BillManager
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, total: 4631 }
  });
  console.log(`Found ${bills.length} in BillManager for 4631`);
  
  // Let's print all BillManagers for this user between Jul 20 and Jul 22
  const allBills = await prisma.billManager.findMany({
    where: {
      clerkUserId: clerkId,
      createdAt: {
        gte: new Date('2026-07-20T00:00:00Z'),
        lte: new Date('2026-07-23T00:00:00Z')
      }
    }
  });
  console.log(`Found ${allBills.length} bills between jul 20 and 22 for user`);
  allBills.forEach(b => {
    console.log(`Bill ID: ${b.id}, Total: ${b.total}, Token: ${b.tokenNumber}, Date: ${b.createdAt}`);
  });
}

main().finally(() => prisma.$disconnect());
