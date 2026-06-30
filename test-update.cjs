const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const profile = await prisma.businessProfile.findFirst({ where: { userId: 'user_32auM1WPkuZ4rSm0JjnKL3gS7Ip' } });
  if (!profile) return;
  const updated = await prisma.businessProfile.update({
    where: { id: profile.id },
    data: { taxInclusive: true }
  });
  console.log('Updated profile taxInclusive:', updated.taxInclusive);
  process.exit(0);
}
run();
