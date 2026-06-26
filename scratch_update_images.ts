import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: 'peekushungerhub@gmail.com' },
        { phone: '8920681229' }
      ]
    }
  });

  let clerkId = user?.clerkId;

  if (!clerkId) {
    const profiles = await prisma.businessProfile.findMany({
      where: {
        OR: [
          { businessEmail: 'peekushungerhub@gmail.com' },
          { contactPersonEmail: 'peekushungerhub@gmail.com' },
          { contactPersonPhone: { contains: '8920681229' } }
        ]
      },
      include: { user: true }
    });
    if (profiles.length > 0) {
      clerkId = profiles[0].user.clerkId;
    }
  }

  if (!clerkId) {
    console.log("Could not find user.");
    return;
  }

  console.log("Found user clerkId:", clerkId);
  const items = await prisma.item.findMany({
    where: { clerkId }
  });

  for (const item of items) {
    if (!item.image || item.image.includes('product-photography') || item.imageUrl?.includes('product-photography') || item.image.includes('placeholder')) {
      console.log("Needs update:", item.id, item.name, item.image);
    } else {
      console.log("Has image:", item.id, item.name, item.image);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
