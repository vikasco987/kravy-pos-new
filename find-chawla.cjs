const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'chawla', mode: 'insensitive' } }
  });
  console.log("Users with chawla in email:", users);
  
  const profiles = await prisma.businessProfile.findMany({
    where: { businessName: { contains: 'chawla', mode: 'insensitive' } }
  });
  console.log("Profiles with chawla in name:", profiles.map(p => ({
    id: p.id,
    userId: p.userId,
    name: p.businessName,
    taxInclusive: p.taxInclusive,
    perProductTaxEnabled: p.perProductTaxEnabled
  })));
}
main().finally(() => prisma.$disconnect());
