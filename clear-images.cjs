const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'prabhatbrothers@gmail.com' } });
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("Found user:", user.name, user.id);
  
  const result = await prisma.item.updateMany({
    where: { userId: user.id },
    data: { imageUrl: null, image: null }
  });
  
  console.log("Updated items count:", result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
