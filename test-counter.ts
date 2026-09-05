import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.businessProfile.findFirst();
  console.log("Profile serialCounter:", profile?.serialCounter);
}

main().catch(console.error).finally(() => prisma.$disconnect());
