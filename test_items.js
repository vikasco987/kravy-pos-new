const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const items = await prisma.item.findMany({
    take: 5,
    include: { category: true }
  });
  console.log(JSON.stringify(items, null, 2));
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
