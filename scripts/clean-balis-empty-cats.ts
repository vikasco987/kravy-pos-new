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
    where: { clerkId: user.clerkId },
    include: {
      items: true
    }
  });

  let deletedCount = 0;
  for (const cat of categories) {
    if (cat.items.length === 0) {
      await prisma.category.delete({
        where: { id: cat.id }
      });
      console.log(`Deleted empty category: ${cat.name}`);
      deletedCount++;
    }
  }

  console.log(`\nDeleted ${deletedCount} empty categories.`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  prisma.$disconnect();
});
