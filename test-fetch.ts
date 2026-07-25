import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'mddanishalam496@gmail.com' },
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    console.log('Found User:', user.name, user.clerkId);

    const items = await prisma.item.findMany({
      where: { clerkId: user.clerkId! },
    });

    console.log(`Found ${items.length} items for this user.`);
    console.log(items.map(i => i.name).slice(0, 10));

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
