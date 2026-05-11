import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking last 20 updated items in the ENTIRE database...");
  
  const items = await prisma.item.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      imageUrl: true,
      image: true,
      updatedAt: true,
      clerkId: true
    }
  });

  console.log(JSON.stringify(items, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
