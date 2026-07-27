const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = "custom_1780926122156_h2bai";

  // First, let's see if there are matching Orders
  const orders = await prisma.order.findMany({
    where: {
      clerkUserId: clerkId,
      createdAt: {
        gte: new Date('2026-07-26T22:55:00Z'),
        lte: new Date('2026-07-26T23:15:00Z')
      }
    }
  });
  console.log("Matching Orders:", orders.map(o => ({ id: o.id, total: o.total, token: o.tokenNumber })));

  // Perform deletion of BillManager Token 21
  const billIdToDelete = '6a66447117159cba3c9410f1';
  console.log(`Deleting BillManager ID: ${billIdToDelete}`);
  await prisma.billManager.delete({
    where: { id: billIdToDelete }
  });

  // Update BillManager Token 22 to 21
  const billIdToUpdate = '6a66472b6aaa1a72db3feb90';
  console.log(`Updating Token for BillManager ID: ${billIdToUpdate} from 22 to 21`);
  await prisma.billManager.update({
    where: { id: billIdToUpdate },
    data: { tokenNumber: 21 }
  });

  // Also delete corresponding Orders if found
  for (const o of orders) {
    if (Math.abs(o.total - 4630.5) < 1 && o.tokenNumber === 21) {
      console.log(`Deleting Order ID: ${o.id}`);
      await prisma.order.delete({ where: { id: o.id } });
    }
    if (Math.abs(o.total - 4630.5) < 1 && o.tokenNumber === 22) {
      console.log(`Updating Token for Order ID: ${o.id}`);
      await prisma.order.update({ where: { id: o.id }, data: { tokenNumber: 21 } });
    }
  }

  console.log("Successfully deleted the duplicate bill and re-arranged the tokens.");
}

main().finally(() => prisma.$disconnect());
