import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  const startIST = new Date("2026-07-03T00:00:00.000Z");
  startIST.setHours(startIST.getHours() - 5, startIST.getMinutes() - 30); // 3rd July 00:00 IST -> UTC
  
  const endIST = new Date("2026-07-03T23:59:59.999Z");
  endIST.setHours(endIST.getHours() - 5, endIST.getMinutes() - 30); // 3rd July 23:59 IST -> UTC

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST } }
  });
  
  console.log("3rd July valid bills total:", bills.filter(b => !b.isDeleted).reduce((s, b) => s + b.total, 0));
  console.log("3rd July deleted bills total:", bills.filter(b => b.isDeleted).reduce((s, b) => s + b.total, 0));
  console.log("3rd July held bills total:", bills.filter(b => b.isHeld).reduce((s, b) => s + b.total, 0));
  
  const orders = await prisma.order.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: startIST, lte: endIST } }
  });
  
  console.log("3rd July orders total:", orders.reduce((s, o) => s + o.total, 0));
  
  // Did they make a 5000 manual invoice?
  const manual = await prisma.manualInvoice.findMany({
    where: { clerkUserId: clerkId, date: { gte: startIST, lte: endIST } }
  });
  console.log("3rd July manual invoices total:", manual.reduce((s, m) => s + m.total, 0));
  
  // Find any bill or order around 5000
  const largeBills = bills.filter(b => b.total >= 4000 && b.total <= 6000);
  console.log("Large bills around 5000:", largeBills.map(b => ({ id: b.id, total: b.total, isDeleted: b.isDeleted, isHeld: b.isHeld, paymentStatus: b.paymentStatus })));
}

main().finally(() => prisma.$disconnect());
