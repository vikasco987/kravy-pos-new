const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai'; // Chawla Chicken
  
  await prisma.businessProfile.updateMany({
    where: { userId: clerkId },
    data: {
      taxInclusive: false,
      perProductTaxEnabled: false
    }
  });
  
  console.log("Forced Chawla profile to be EXCLUSIVE in the database.");
}
main().finally(() => prisma.$disconnect());
