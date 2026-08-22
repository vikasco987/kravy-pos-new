import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { phone: { contains: '7717772841' } }
    });

    if (!user) return;

    // Find all items priced at 199 and delete them
    const itemsToDelete = await prisma.item.findMany({
      where: { clerkId: user.clerkId, sellingPrice: 199 } // sellingPrice or price
    });
    
    const itemsToDeleteByPrice = await prisma.item.findMany({
      where: { clerkId: user.clerkId, price: 199 }
    });

    const allToDelete = [...itemsToDelete, ...itemsToDeleteByPrice].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);

    console.log(`Deleting ${allToDelete.length} items with price 199...`);
    for (const item of allToDelete) {
      console.log(`- Deleting: ${item.name}`);
      await prisma.item.delete({ where: { id: item.id } });
    }
    console.log("Done deleting.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
