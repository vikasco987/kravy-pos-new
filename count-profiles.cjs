const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const profiles = await prisma.businessProfile.findMany({
    where: { userId: clerkId }
  });
  
  console.log(`Chawla has ${profiles.length} profiles.`);
  profiles.forEach(p => console.log(`- ID: ${p.id}, taxInclusive: ${p.taxInclusive}, perProductTaxEnabled: ${p.perProductTaxEnabled}`));
}
main().finally(() => prisma.$disconnect());
