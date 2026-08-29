import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const profile = await prisma.businessProfile.findFirst({ where: { userId: 'user_3D50GqQtgxSAM58kGTRwzdUk3Xc' }});
  console.log("Bill Counter:", profile.billCounter);
  const bills = await prisma.billManager.findMany({
      where: { clerkUserId: 'user_3D50GqQtgxSAM58kGTRwzdUk3Xc' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { billNumber: true, createdAt: true }
  });
  console.log("Latest bills:", bills);
  process.exit(0);
}
run();
