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
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST }, isDeleted: false }
  });
  
  // Try to replicate GST Report Logic
  let totalTaxable = 0;
  let totalGST = 0;

  for (const bill of bills) {
      if (bill.paymentStatus.toUpperCase() === "CANCELLED") continue;
      // Some bills might be tax exclusive or inclusive
      // GST is usually bill.tax
      // Taxable is usually bill.subtotal or (bill.subtotal - discount)
      
      let items = typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items;
      
      // Let's just sum bill.tax and bill.subtotal first to see if it matches
      totalGST += bill.tax || 0;
  }
  
  console.log("Total GST from bills.tax:", totalGST);
  
  // check GST api
}

main().finally(() => prisma.$disconnect());
