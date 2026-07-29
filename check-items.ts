import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const clerkId = 'custom_1785308717498_zm3gfr';
    const items = await prisma.item.findMany({
      where: { clerkId }
    });

    console.log(`Total items found for Arihant Enterprise: ${items.length}`);
    console.log("Sample items:", items.slice(0, 15).map(i => ({
      id: i.id,
      name: i.name,
      category: i.categoryId,
      imageUrl: i.imageUrl || i.image,
      isVeg: i.isVeg
    })));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
