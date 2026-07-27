const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'mahajan', mode: 'insensitive' } }
  });
  
  if (users.length === 0) {
    console.log("No user found");
    return;
  }
  
  const clerkId = users[0].clerkId;
  const orders = await prisma.order.findMany({
    where: { clerkUserId: clerkId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log("Recent orders for mahajan:");
  orders.forEach(o => {
    let numItems = 0;
    try {
      if (Array.isArray(o.items)) numItems = o.items.length;
    } catch(e){}
    console.log(`ID: ${o.id}, Total: ${o.total}, Items: ${numItems}, Date: ${o.createdAt}, Token: ${o.tokenNumber}`);
  });
}

main().finally(() => prisma.$disconnect());
