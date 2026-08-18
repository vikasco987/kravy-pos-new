import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: 'vidi.organicafe@gmail.com'
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User:', user.id, user.clerkId);

    const categories = await prisma.category.findMany({
      where: {
        clerkId: user.clerkId
      }
    });

    console.log('Categories:', categories.map(c => ({ id: c.id, name: c.name })));

    const pizzaCategory = categories.find(c => c.name.toLowerCase().includes('pizza'));
    if (!pizzaCategory) {
      console.log('Pizza category not found');
      return;
    }

    const pizzas = await prisma.item.findMany({
      where: {
        categoryId: pizzaCategory.id,
        clerkId: user.clerkId
      }
    });

    console.log('Pizzas:', JSON.stringify(pizzas.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      variants: p.variants,
      image: p.image
    })), null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
