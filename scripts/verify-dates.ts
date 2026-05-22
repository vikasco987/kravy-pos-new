import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🔌 Connecting to DB to verify BusinessProfile dates...");
  try {
    const profiles = await prisma.businessProfile.findMany({
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    console.log(`📋 Loaded ${profiles.length} BusinessProfiles:`);
    profiles.forEach(p => {
      console.log(`ID: ${p.id}, UserID: ${p.userId}, CreatedAt: ${p.createdAt}, UpdatedAt: ${p.updatedAt}`);
    });
  } catch (error) {
    console.error("🚨 Verification Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
