import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  const clerkId = user.clerkId;
  const start = new Date("2026-07-01T00:00:00.000Z");
  const end = new Date("2026-07-31T23:59:59.999Z");

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: start, lte: end }, isDeleted: false, isHeld: false }
  });
  
  const profile = await prisma.businessProfile.findFirst({ where: { userId: clerkId } });
  const globalGstRate = profile?.taxEnabled ? (profile?.taxRate || 0) : 0;
  const perProductEnabled = profile?.perProductTaxEnabled ?? false;
  const taxInclusive = profile?.taxInclusive ?? false;
  
  let totalTaxableAll = 0;
  let totalGstAll = 0;
  let totalBillTotal = 0;

  for (const bill of bills) {
      if (bill.paymentStatus.toUpperCase() === "CANCELLED") continue;
      
      let billTaxable = 0;
      let billGst = 0;
      let items = typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items;
      
      items.forEach((item: any) => {
        const rate = (perProductEnabled && item.gst !== undefined && item.gst !== null) ? Number(item.gst) : globalGstRate;
        const qty = Number(item.qty || item.quantity) || 0;
        const price = Number(item.rate || item.price) || 0;
        const gross = qty * price;
        
        let taxable = 0;
        let gst = 0;
        
        let isInclusive = false;
        if (perProductEnabled) {
          isInclusive = item.taxStatus === "With Tax";
        } else {
          isInclusive = taxInclusive;
        }

        if (isInclusive) {
          taxable = gross / (1 + rate / 100);
          gst = gross - taxable;
        } else {
          taxable = gross;
          gst = (gross * rate) / 100;
        }

        billTaxable += taxable;
        billGst += gst;
      });
      
      const dGst = Number(bill.deliveryGst || 0);
      const pGst = Number(bill.packagingGst || 0);
      const chargesGst = dGst + pGst;
      billGst += chargesGst;
      
      totalTaxableAll += billTaxable;
      totalGstAll += billGst;
      totalBillTotal += bill.total;
  }
  
  console.log("Computed Taxable:", totalTaxableAll);
  console.log("Computed GST:", totalGstAll);
  console.log("Computed Total (Taxable + GST):", totalTaxableAll + totalGstAll);
  console.log("Actual Bill.total Sum:", totalBillTotal);
}

main().finally(() => prisma.$disconnect());
