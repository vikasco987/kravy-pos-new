const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.rolePermission.findMany();
  console.log('Results:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
