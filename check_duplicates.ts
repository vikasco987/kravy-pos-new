import { PrismaClient } from '@prisma.js';
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.menu.findMany({
    where: { clerkUserId: "user_32auM1WPkuZ4rSm0JjnKL3gS7Ip" }
  });
  
  const map = new Map();
  const duplicates = [];
  
  for (const item of items) {
    const key = item.name + "-" + item.category;
    if (map.has(key)) {
      duplicates.push({ id: item.id, name: item.name, category: item.category, original: map.get(key).id });
    } else {
      map.set(key, item);
    }
  }
  console.log("Duplicates found:", duplicates.length);
  console.log(duplicates.slice(0, 5));
}
main();
