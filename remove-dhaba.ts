import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'shreeradha88@gmail.com', mode: 'insensitive' } },
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    // 1. Find and delete all items currently in Dhaba zone
    const deletedDhaba = await prisma.item.deleteMany({
        where: { userId: user.id, zones: { has: 'Dhaba' } }
    });
    console.log(`Deleted ${deletedDhaba.count} active Dhaba items.`);

    // 2. Find and delete the inactive (Full) variants that were previously part of Dhaba
    const allUserItems = await prisma.item.findMany({
        where: { userId: user.id }
    });
    
    // The previously hidden (Full) items were made inactive. 
    // Let's identify them safely by checking if they are inactive and end with (Full).
    const fullItemsToDelete = allUserItems.filter(i => 
        i.name.endsWith(' (Full)') && 
        i.isActive === false
    );

    let deletedFullCount = 0;
    for (const item of fullItemsToDelete) {
        await prisma.item.delete({
            where: { id: item.id }
        });
        deletedFullCount++;
    }
    console.log(`Deleted ${deletedFullCount} hidden Full variants.`);
    
    console.log("Dhaba zone items successfully removed.");

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
