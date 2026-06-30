const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const items = await prisma.item.findMany({
    where: { name: { contains: 'Chaap' } },
    select: { id: true, name: true, category: { select: { name: true } }, clerkId: true }
  });
  console.log(JSON.stringify(items, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
