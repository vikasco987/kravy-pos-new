
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function update() {
  const profile = await prisma.businessProfile.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (profile) {
    const res = await prisma.businessProfile.update({
      where: { id: profile.id },
      data: { posHoldEnabled: false }
    });
    console.log("UPDATED SUCCESS - posHoldEnabled is now FALSE");
    console.log(res);
  }
}

update().catch(console.error);
