const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  // Find bill INV/2607/0025
  const bill = await prisma.billManager.findFirst({
    where: { clerkUserId: clerkId, billNumber: 'INV/2607/0025' }
  });
  
  if (bill) {
    await prisma.billManager.delete({ where: { id: bill.id } });
    console.log("Deleted new test bill 0025!");
    
    // reset token
    const profile = await prisma.businessProfile.findFirst({ where: { userId: clerkId }});
    if (profile && profile.lastTokenNumber && profile.lastTokenNumber >= bill.tokenNumber) {
       await prisma.businessProfile.update({
         where: { id: profile.id },
         data: { lastTokenNumber: bill.tokenNumber - 1 }
       });
       console.log("Decremented token back to " + (bill.tokenNumber - 1));
    }
  } else {
    console.log("No bill 0025 found!");
  }
}
main().finally(() => prisma.$disconnect());
