import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findUnique({ where: { email: "gorapallisrikanth45@gmail.com" } });
    if (!user) {
      console.log("User not found");
      return;
    }
    const clerkId = user.clerkId;
    console.log("Clerk ID:", clerkId);
    
    // fetch their business profile
    const profile = await prisma.businessProfile.findFirst({ where: { userId: clerkId } });
    console.log("Profile:", profile);

    // check latest bills
    const lastBills = await prisma.billManager.findMany({
      where: { clerkUserId: clerkId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log("Recent Bills count:", lastBills.length);
    if(lastBills.length > 0) {
       console.log("Latest bill:", lastBills[0]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
