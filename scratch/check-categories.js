import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const clerkId = "custom_1777896458618_rmhrp9";
  const categories = await prisma.category.findMany({
    where: { clerkId }
  });
  console.log("CATEGORIES FOUND:", categories.length);
  categories.forEach(c => console.log(`- ${c.name} (${c.id})`));
  
  process.exit(0);
}

check();
