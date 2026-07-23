const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const parties = await prisma.party.findMany({
    where: {
      OR: [
        { address: { contains: 'Maharash', mode: 'insensitive' } },
        { address: { contains: 'MH', mode: 'insensitive' } },
        { address: { contains: 'Mumbai', mode: 'insensitive' } },
        { address: { contains: 'Pune', mode: 'insensitive' } }
      ]
    }
  });
  console.log(JSON.stringify(parties, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
