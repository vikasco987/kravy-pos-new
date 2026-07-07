const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.businessProfile.findFirst({
    where: { userId: 'custom_1780926122156_h2bai' }
  });
  console.log(profile);
}
main().finally(() => prisma.$disconnect());
