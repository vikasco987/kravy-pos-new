import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany({
    where: {
      variants: {
        isEmpty: false
      }
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(items.map(i => ({ name: i.name, variants: i.variants })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
