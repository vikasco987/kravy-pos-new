import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'support.thereunionadda@gmail.com';
  
  const user = await prisma.user.findFirst({
    where: { email: email }
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  const items = await prisma.item.findMany({
    where: { userId: user.id }
  });

  const clerkIds = new Set(items.map(i => i.clerkId));
  console.log(`Clerk IDs used by these ${items.length} items:`, Array.from(clerkIds));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
