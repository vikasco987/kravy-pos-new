
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const profiles = await prisma.businessProfile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(JSON.stringify(profiles[0], null, 2));
}

check().catch(console.error);
