const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const bill = await prisma.billManager.findFirst({
    where: { clerkUserId: clerkId, billNumber: 'INV/2607/0024' }
  });
  
  if (!bill) {
    console.log("Bill 0024 not found!");
    return;
  }
  
  const items = Array.isArray(bill.items) ? bill.items : [];
  
  console.log("Original Bill:", {
    subtotal: bill.subtotal,
    tax: bill.tax,
    total: bill.total,
    items: items.map(i => ({ name: i.name, qty: i.qty, rate: i.rate, gst: i.gst, taxStatus: i.taxStatus }))
  });
  
  let newSubtotal = 0;
  let newTax = 0;
  
  const newItems = items.map(item => {
     const rate = Number(item.rate || item.price || 0);
     const qty = Number(item.qty || 1);
     const gross = qty * rate;
     const gstRate = Number(item.gst ?? 5);
     
     const gst = (gross * gstRate) / 100;
     newSubtotal += gross;
     newTax += gst;
     
     return { ...item, taxStatus: 'Without Tax' };
  });
  
  // also add packaging, delivery logic
  const pkgGst = Number(bill.packagingGst || 0);
  const delGst = Number(bill.deliveryGst || 0);
  const additionalTax = pkgGst + delGst;
  const finalTax = newTax + additionalTax;
  
  const discount = Number(bill.discountAmount || 0);
  const serviceCharge = Number(bill.serviceCharge || 0);
  const packaging = Number(bill.packagingCharges || 0);
  const delivery = Number(bill.deliveryCharges || 0);
  
  const newTotal = newSubtotal - discount + finalTax + packaging + delivery + serviceCharge;
  
  console.log("Calculated Exclusive:", {
    newSubtotal, newTax, finalTax, newTotal
  });
  
  await prisma.billManager.update({
    where: { id: bill.id },
    data: {
      items: newItems,
      subtotal: newSubtotal,
      tax: finalTax,
      total: newTotal
    }
  });
  
  console.log("Successfully updated bill 0024 to Exclusive!");
}
main().finally(() => prisma.$disconnect());
