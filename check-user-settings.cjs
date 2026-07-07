const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  const profile = await prisma.businessProfile.findFirst({ where: { userId: clerkId }});
  console.log("Profile settings:", {
    taxActive: profile.taxActive,
    taxRate: profile.taxRate,
    taxInclusive: profile.taxInclusive,
    perProductTaxEnabled: profile.perProductTaxEnabled,
  });
  
  // Also let's check one of their menu items (like Cream Chicken)
  const item = await prisma.menuItem.findFirst({
    where: { clerkUserId: clerkId, name: { contains: 'Cream Chicken' } }
  });
  console.log("Menu Item:", item ? { name: item.name, taxStatus: item.taxStatus, gst: item.gst } : "Not found");
}
main().finally(() => prisma.$disconnect());
