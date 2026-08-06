import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  const start = new Date("2026-07-31T18:30:00.000Z");
  const end = new Date("2026-08-31T18:29:59.999Z");

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: start, lte: end }, isDeleted: false, isHeld: false }
  });
  
  let totalDelivery = 0;
  let totalPackaging = 0;
  let totalService = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let sumTotal = 0;
  
  bills.forEach(b => {
      if (b.paymentStatus.toUpperCase() === "CANCELLED") return;
      totalDelivery += b.deliveryCharges || 0;
      totalPackaging += b.packagingCharges || 0;
      totalService += b.serviceCharge || 0;
      totalDiscount += b.discountAmount || 0;
      totalTax += b.tax || 0;
      sumTotal += b.total;
  });
  
  console.log("Delivery Charges:", totalDelivery);
  console.log("Packaging Charges:", totalPackaging);
  console.log("Service Charges:", totalService);
  console.log("Total Extra Charges:", totalDelivery + totalPackaging + totalService);
  console.log("Discounts:", totalDiscount);
  console.log("Total Tax in Bills:", totalTax);
  console.log("Net Revenue (Sum Total):", sumTotal);
}

main().finally(() => prisma.$disconnect());
