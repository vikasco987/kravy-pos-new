const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  const billNum = 'INV/2607/0025';
  
  const bill = await prisma.billManager.findFirst({
    where: { clerkUserId: clerkId, billNumber: billNum }
  });
  
  if (!bill) {
    console.log("Bill not found!");
    return;
  }
  
  console.log("Found bill:", bill.id, bill.billNumber, "Token:", bill.tokenNumber);
  
  // Delete the bill
  await prisma.billManager.delete({
    where: { id: bill.id }
  });
  console.log("Bill deleted successfully.");
  
  // Find business profile and decrement token/counter
  const profile = await prisma.businessProfile.findFirst({
    where: { userId: clerkId }
  });
  
  if (profile) {
    console.log("Current lastTokenNumber:", profile.lastTokenNumber);
    // Let's also check if there is a bill counter or if it relies on count
    // Wait, bill number is generated based on count or what?
    // Let's see if we need to decrement lastTokenNumber
    if (profile.lastTokenNumber && profile.lastTokenNumber >= bill.tokenNumber) {
       await prisma.businessProfile.update({
         where: { id: profile.id },
         data: { lastTokenNumber: bill.tokenNumber - 1 }
       });
       console.log(`Decremented lastTokenNumber to ${bill.tokenNumber - 1}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
