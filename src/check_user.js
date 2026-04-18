const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true, clerkId: true }
  });
  console.log('USERS_DATA_START');
  console.log(JSON.stringify(users, null, 2));
  console.log('USERS_DATA_END');
}
main().catch(console.error).finally(() => prisma.$disconnect());
