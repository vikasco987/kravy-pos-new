import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  const startIST = new Date("2026-06-30T18:30:00.000Z");
  const endIST = new Date("2026-07-31T18:29:59.999Z");

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST }, isDeleted: false, total: { gte: 4900, lte: 5100 } }
  });
  console.log("Bills around 5000:");
  bills.forEach(b => console.log(`${b.createdAt.toISOString()} - ${b.billNumber} - ${b.total} - ${b.paymentMode} - ${b.tableName}`));

  // Check items inside bills for 5000
  const allBills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST }, isDeleted: false }
  });
  let foundItem = false;
  allBills.forEach(b => {
    let items = typeof b.items === 'string' ? JSON.parse(b.items) : b.items;
    if (Array.isArray(items)) {
       items.forEach(i => {
           if (i.price * i.qty === 5000 || i.rate * i.qty === 5000) {
               console.log(`Bill ${b.billNumber} has item ${i.name} exactly 5000`);
               foundItem = true;
           }
       });
    }
  });
  if(!foundItem) console.log("No items exactly 5000");

  // What about Manual Invoice?
  const invoices = await prisma.manualInvoice.findMany({
    where: { clerkUserId: clerkId, date: { gte: startIST, lte: endIST }, total: { gte: 4900, lte: 5100 } }
  });
  invoices.forEach(i => console.log(`Manual Invoice ${i.invoiceNumber} - ${i.total}`));
}

main().finally(() => prisma.$disconnect());
