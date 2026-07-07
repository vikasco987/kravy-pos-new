const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: today }, isDeleted: false },
    orderBy: { createdAt: 'asc' }
  });
  
  let i = 1;
  for (const b of bills) {
    const parts = b.billNumber.split('/');
    const prefix = parts.slice(0, 2).join('/'); // INV/2607
    const newBillNumber = `${prefix}/${String(i).padStart(4, '0')}`;
    
    await prisma.billManager.update({
      where: { id: b.id },
      data: {
        tokenNumber: i,
        billNumber: newBillNumber
      }
    });
    console.log(`Updated ${b.id} to Token: ${i}, BillNumber: ${newBillNumber}`);
    i++;
  }
  
  await prisma.businessProfile.updateMany({
    where: { userId: clerkId },
    data: {
      lastTokenNumber: i - 1
    }
  });
  console.log("Updated lastTokenNumber to", i - 1);
}
main().finally(() => prisma.$disconnect());
