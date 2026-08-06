import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  const startIST = new Date("2026-06-30T18:30:00.000Z");
  const endIST = new Date("2026-07-31T18:29:59.999Z");

  const orders = await prisma.order.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST }, isDeleted: false }
  });
  console.log("Total QR Orders Sum:", orders.reduce((s, o) => s + o.total, 0));
  
  const unpaidOrders = orders.filter(o => o.status !== "COMPLETED");
  console.log("Uncompleted QR Orders Sum:", unpaidOrders.reduce((s, o) => s + o.total, 0));

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST }, isDeleted: false }
  });
  console.log("Bills Total Sum:", bills.reduce((s, b) => s + b.total, 0));
  console.log("Bills Subtotal Sum:", bills.reduce((s, b) => s + b.subtotal, 0));
  console.log("Bills AmountPaid Sum:", bills.reduce((s, b) => s + (b.amountPaid || 0), 0));
  console.log("Bills BalanceDue Sum:", bills.reduce((s, b) => s + (b.balanceDue || 0), 0));
}

main().finally(() => prisma.$disconnect());
