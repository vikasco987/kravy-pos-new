import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        phone: { contains: '7717772841' } 
      }
    });

    if (!user) {
      console.log('User not found by normalized phone, trying with spaces...');
      const user2 = await prisma.user.findFirst({
        where: { phone: { contains: '77177' } }
      });
      if (user2) console.log('Found user:', user2.phone, user2.name, user2.clerkId);
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
      console.log(`- [${cat}] ${i.name} | Price: ${i.price}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
