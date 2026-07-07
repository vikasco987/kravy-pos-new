const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const bills = await prisma.billManager.findMany({
    where: { 
        clerkUserId: clerkId, 
        billNumber: { in: ['INV/2607/0025', 'INV/2607/0026'] }
    }
  });
  
  if (bills.length > 0) {
    await prisma.billManager.deleteMany({
      where: { id: { in: bills.map(b => b.id) } }
    });
    console.log(`Deleted ${bills.length} test bills!`);
    
    const profile = await prisma.businessProfile.findFirst({ where: { userId: clerkId }});
    if (profile) {
       await prisma.businessProfile.update({
         where: { id: profile.id },
         data: { lastTokenNumber: 1 } 
       });
       console.log("Reset token back to 1");
    }
  } else {
    console.log("No bills found!");
  }
}
main().finally(() => prisma.$disconnect());
