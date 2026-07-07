const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const billId = '6a452604010c16cdfcb53db9';
  const clerkId = 'custom_1780926122156_h2bai';
  
  await prisma.billManager.delete({
    where: { id: billId }
  });
  console.log(`Deleted bill ${billId}`);
  
  await prisma.businessProfile.updateMany({
    where: { userId: clerkId },
    data: { lastTokenNumber: 2 }
  });
  console.log("Reset lastTokenNumber to 2");
}
main().finally(() => prisma.$disconnect());
