import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const profile = await prisma.businessProfile.findFirst();
    if (profile) {
      console.log("Found profile keys:", Object.keys(profile));
    } else {
      console.log("No profile found to check keys.");
    }
  } catch (err) {
    console.error("Error during check:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
