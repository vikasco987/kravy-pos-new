const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai'; // Chawla Chicken
  
  const profile = await prisma.businessProfile.findFirst({
    where: { userId: clerkId }
  });
  
  console.log("Business Profile Settings for Chawla:");
  console.log({
    taxEnabled: profile.taxEnabled,
    taxRate: profile.taxRate,
    taxInclusive: profile.taxInclusive,
    perProductTaxEnabled: profile.perProductTaxEnabled,
  });
  
  // Let's get the 5 most recently updated items
  const items = await prisma.menuItem.findMany({
    where: { clerkUserId: clerkId },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });
  
  console.log("\nRecent Menu Items:");
  items.forEach(item => {
    console.log(`- ${item.name}: taxStatus="${item.taxStatus}", gst=${item.gst}%`);
  });
}

main().finally(() => prisma.$disconnect());
