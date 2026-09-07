import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'dalegno@gmail.com', mode: 'insensitive' } },
  });
  const items = await prisma.item.findMany({
    where: { userId: user.id }
  });
  let missing = 0;
  for (const i of items) {
     console.log(`${i.name} : ${i.image}`);
     if (!i.image || i.image.includes('placeholder')) missing++;
  }
  console.log('Missing/Placeholder:', missing);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
