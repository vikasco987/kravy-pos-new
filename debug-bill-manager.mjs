import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const effectiveId = 'user_3D50GqQtgxSAM58kGTRwzdUk3Xc'; // gorapallisrikanth45@gmail.com
  const items = [
    {
      id: "69f35c33ca73c21ab0edf7ce", // fake id
      name: "Test Item",
      price: 100,
      quantity: 1,
      total: 100,
      taxStatus: "Without Tax",
      gst: 0
    }
  ];
  
  const body = {
    items,
    subtotal: 100,
    total: 100,
    discountAmount: 0,
    cgst: 0,
    sgst: 0,
    paymentMode: "CASH",
    paymentStatus: "Paid",
    customerName: "Walk-in",
    tableName: "Counter",
    tokenNumber: 999,
    amountPaid: 100
  };

  try {
    const profile = await prisma.businessProfile.findFirst({ where: { userId: effectiveId }, orderBy: { createdAt: 'asc' } });
    console.log("Profile:", !!profile);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const lastBill = await prisma.billManager.findFirst({
        where: { clerkUserId: effectiveId, createdAt: { gte: monthStart }, OR: [{ billNumber: { startsWith: 'INV/' } }, { billNumber: { startsWith: 'SV/' } }] },
        orderBy: { createdAt: 'desc' },
        select: { billNumber: true }
    });
    console.log("Last Bill:", lastBill);

    // Simulate item calculation
    let calcSubtotal = 0;
    // skip actual dbItems find for mock
    calcSubtotal = 100;
    
    let calculatedTax = 0;
    // tax = 0
    
    let finalSubtotal = Number(calcSubtotal.toFixed(2));
    let finalTotal = Number((finalSubtotal + calculatedTax).toFixed(2));
    
    console.log("Final total:", finalTotal);
    
    let nextSerial = 1;
    if (lastBill && lastBill.billNumber) {
      const parts = lastBill.billNumber.split('/');
      const lastSerial = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
    }
    console.log("Next Serial:", nextSerial);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
