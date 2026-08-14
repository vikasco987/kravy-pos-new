import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = "balis.cuisine@gmail.com";
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      orders: true
    }
  });

  if (!user) return;

  const oldItems = new Set<string>();

  for (const order of user.orders) {
    const items = order.items as any[];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.name) oldItems.add(item.name.toUpperCase());
      }
    }
  }

  const currentItems = await prisma.item.findMany({
    where: { clerkId: user.clerkId }
  });

  const currentItemNames = new Set(currentItems.map(i => i.name.toUpperCase()));

  console.log("Items in Orders but not in Current Menu:");
  let count = 0;
  for (const name of oldItems) {
    if (!currentItemNames.has(name)) {
      console.log(`- ${name}`);
      count++;
    }
  }
  
  console.log(`Total missing: ${count}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  prisma.$disconnect();
});
