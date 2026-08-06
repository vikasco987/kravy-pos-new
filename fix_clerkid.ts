import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const wrongClerkId = '6a7482af37214b9a1a2deac4';
  const correctClerkId = 'custom_a2fb2785-c0e5-461d-b73d-a7b5b8ef7c2e';
  
  const updatedItems = await prisma.item.updateMany({
    where: { clerkId: wrongClerkId },
    data: { clerkId: correctClerkId }
  });
  
  const updatedCategories = await prisma.category.updateMany({
    where: { clerkId: wrongClerkId },
    data: { clerkId: correctClerkId }
  });
  
  console.log(`Fixed ${updatedItems.count} items and ${updatedCategories.count} categories.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
