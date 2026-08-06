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
  
  const totalDiscount = bills.reduce((s, b) => s + (b.discountAmount || 0), 0);
  console.log("Total Discount in July:", totalDiscount);
  
  // also sum (item.qty * item.price)
  let sumOfItems = 0;
  bills.forEach(b => {
      if (b.paymentStatus.toUpperCase() === "CANCELLED") return;
      let items = typeof b.items === 'string' ? JSON.parse(b.items) : b.items;
      items.forEach((i: any) => {
          sumOfItems += (i.qty || i.quantity || 1) * (i.rate || i.price || 0);
      });
  });
  console.log("Sum of all items (qty * rate) without discount:", sumOfItems);
  
  const totalSales = bills.filter(b => b.paymentStatus.toUpperCase() !== "CANCELLED").reduce((s, b) => s + b.total, 0);
  console.log("Total Sales (Bill.total):", totalSales);
}

main().finally(() => prisma.$disconnect());
