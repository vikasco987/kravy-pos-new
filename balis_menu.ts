import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'balis.cuisine@gmail.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User ID:', user.id, 'Clerk ID:', user.clerkId);

    const categories = await prisma.category.findMany({
      where: { clerkId: user.clerkId }
    });
    
    console.log('\nCategories:');
    categories.forEach(c => console.log(`- ${c.id}: ${c.name}`));

    const items = await prisma.item.findMany({
      where: { clerkId: user.clerkId }
    });

    console.log(`\nItems (${items.length}):`);
    items.forEach(i => {
      const cat = categories.find(c => c.id === i.categoryId)?.name || 'Unknown';
      console.log(`- [${cat}] ${i.name} | Price: ${i.price} | Image: ${i.image ? 'Yes' : 'No'} (${i.image})`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
