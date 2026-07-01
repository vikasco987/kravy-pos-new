const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const bills = await prisma.billManager.findMany({
    where: {
      OR: [
        { billNumber: "NEW-0853" },
        { billNumber: { contains: "NEW" } }
      ]
    }
  });
  console.log('BillManager NEW-*:');
  bills.forEach(b => console.log(b.billNumber, b.total, b.createdAt));

  process.exit(0);
}
run();
