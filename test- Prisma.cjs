const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.rolePermission.upsert({
    where: { role: 'SELLER' },
    update: { allowedPaths: ['/dashboard'] },
    create: { role: 'SELLER', allowedPaths: ['/dashboard'] }
  });
  console.log('Upsert Success:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
