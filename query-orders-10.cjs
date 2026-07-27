const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = "user_3D50GqQtgxSAM58kGTRwzdUk3Xc";
  const orders = await prisma.order.findMany({
    where: { clerkUserId: clerkId },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  console.log("Searching for orders with total quantity = 9");
  orders.forEach(o => {
    let totalQty = 0;
    try {
      if (Array.isArray(o.items)) {
        totalQty = o.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      } else if (typeof o.items === 'string') {
        const parsed = JSON.parse(o.items);
        totalQty = parsed.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      }
    } catch(e) {}
    
    if (totalQty === 9 || Math.round(o.total) === 4631) {
      console.log(`ID: ${o.id}, Total: ${o.total}, Token: ${o.tokenNumber}, Qty: ${totalQty}, Date: ${o.createdAt}`);
    }
  });
}

main().finally(() => prisma.$disconnect());
