import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'support.thereunionadda@gmail.com';
  const phone = '8929134864';
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { phone: phone }
      ]
    }
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  console.log("User found:", user.id, user.email, user.phone);

  const items = await prisma.item.findMany({
    where: { userId: user.id },
    include: { category: true }
  });

  console.log(`Found ${items.length} items for this user.`);
  for (const item of items) {
    console.log(`- ${item.name} | Cat: ${item.category?.name} | Price: ${item.sellingPrice || item.price}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
