const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.businessProfile.findFirst();
  console.log("Profile:", profile);
}

main().catch(console.error).finally(() => prisma.$disconnect());
