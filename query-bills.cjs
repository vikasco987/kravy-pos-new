const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bills = await prisma.billManager.findMany({
    where: {
      total: 4631
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Found Bills:");
  bills.forEach(b => {
    let itemsLength = 0;
    try {
      if (Array.isArray(b.items)) itemsLength = b.items.length;
      else if (typeof b.items === 'string') itemsLength = JSON.parse(b.items).length;
    } catch(e) {}
    console.log(`ID: ${b.id}, Total: ${b.total}, Subtotal: ${b.subtotal}, Tax: ${b.tax}, Token: ${b.tokenNumber}, Items: ${itemsLength}, Date: ${b.createdAt}, Cust: ${b.customerName}, clerkUserId: ${b.clerkUserId}`);
  });
}

main().finally(() => prisma.$disconnect());
