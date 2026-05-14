import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting cleanup of premium fields (Broad Check)...");
  
  // Fetch all profiles and filter manually if needed, or use a more aggressive update
  const allProfiles = await prisma.businessProfile.findMany({
    select: { id: true, showPremiumPopup: true, isPremium: true }
  });

  let count = 0;
  for (const profile of allProfiles) {
    if (profile.showPremiumPopup === null || profile.showPremiumPopup === undefined || profile.isPremium === null || profile.isPremium === undefined) {
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          showPremiumPopup: false,
          isPremium: false
        }
      });
      count++;
    }
  }

  console.log(`Updated ${count} profiles to default values (Popup: Hidden, Premium: False).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
