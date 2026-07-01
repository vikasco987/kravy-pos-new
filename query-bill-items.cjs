const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const bills = await prisma.billManager.findMany();
  const matched = bills.filter(b => {
    try {
      const items = b.items;
      if (!Array.isArray(items)) return false;
      const names = items.map(i => i.name?.toLowerCase() || "");
      if (names.some(n => n.includes("chocolate shake")) && names.some(n => n.includes("sandwich"))) {
        return true;
      }
      return false;
    } catch(e) { return false; }
  });

  console.log(`Found ${matched.length} bills with Chocolate Shake and Sandwich`);
  matched.forEach(b => console.log(`Bill: ${b.billNumber}, Total: ${b.total}, Token: ${b.tokenNumber || (b.kotNumbers ? b.kotNumbers[0] : 'N/A')}, Date: ${b.createdAt}`));

  process.exit(0);
}
run();
