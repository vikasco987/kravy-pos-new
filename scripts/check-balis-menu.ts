import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = "balis.cuisine@gmail.com";
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.clerkId) {
    console.error("User not found or missing clerkId");
    return;
  }
  
  const categories = await prisma.category.findMany({
    where: { clerkId: user.clerkId }
  });

  const items = await prisma.item.findMany({
    where: { clerkId: user.clerkId }
  });

  console.log(`User: ${user.name} (${email})`);
  console.log(`Total Categories: ${categories.length}`);
  console.log(`Total Items: ${items.length}`);

  const activeItems = items.filter(i => i.isActive);
  const inactiveItems = items.filter(i => !i.isActive);
  
  console.log(`Active Items: ${activeItems.length}`);
  console.log(`Inactive Items: ${inactiveItems.length}`);
  
  console.log("Categories and Items:");
  for (const cat of categories) {
    const catItems = items.filter(i => i.categoryId === cat.id);
    console.log(`\n--- ${cat.name} (${catItems.length} items) ---`);
    for (const item of catItems) {
      console.log(`- ${item.name} | ₹${item.price} | Image: ${item.imageUrl ? 'YES' : 'NO'} | Active: ${item.isActive}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  prisma.$disconnect();
});
