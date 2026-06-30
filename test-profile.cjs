const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const profile = await prisma.businessProfile.findFirst({ where: { userId: 'user_32auM1WPkuZ4rSm0JjnKL3gS7Ip' } });
  console.log('taxInclusive:', profile?.taxInclusive);
  console.log('updatedAt:', profile?.updatedAt);
  process.exit(0);
}
run();
