const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  // Get start of July 1st
  const startDate = new Date('2026-07-01T00:00:00+05:30');
  
  const bills = await prisma.billManager.findMany({
    where: { 
      clerkUserId: clerkId, 
      createdAt: { gte: startDate },
      isDeleted: false
    }
  });
  
  console.log(`Found ${bills.length} bills since July 1st for user.`);
  
  for (const b of bills) {
    let newSubtotal = 0;
    let newTax = 0;
    
    if (!Array.isArray(b.items)) continue;

    const newItems = b.items.map(item => {
      item.taxStatus = "Without Tax"; // Force exclusive
      
      const itemGross = item.qty * item.rate;
      const itemGst = itemGross * (item.gst || 0) / 100;
      
      newSubtotal += itemGross;
      newTax += itemGst;
      
      return item;
    });
    
    const deliveryCharge = b.deliveryCharge || 0;
    const packagingCharge = b.packagingCharge || 0;
    const discountAmt = b.discountAmt || 0;
    
    const discountRatio = newSubtotal > 0 ? (newSubtotal - discountAmt) / newSubtotal : 1;
    
    newTax = newItems.reduce((sum, item) => {
      const itemGross = item.qty * item.rate * discountRatio;
      return sum + (itemGross * (item.gst || 0) / 100);
    }, 0);
    
    const charges = deliveryCharge + packagingCharge;
    const totalWithoutTax = (newSubtotal - discountAmt) + charges;
    const chargesGst = charges * 0.05; 
    
    const finalTax = newTax + chargesGst;
    const finalTotal = totalWithoutTax + finalTax;
    
    // Only update if it actually needs to change to avoid unnecessary DB writes
    const currentTotal = Math.round(b.total * 100) / 100;
    const calculatedTotal = Math.round(finalTotal * 100) / 100;
    
    if (currentTotal !== calculatedTotal || b.subtotal !== newSubtotal) {
      await prisma.billManager.update({
        where: { id: b.id },
        data: {
          subtotal: newSubtotal,
          tax: finalTax,
          total: finalTotal,
          items: newItems
        }
      });
      console.log(`Updated Bill ${b.billNumber}: Subtotal=${newSubtotal}, Tax=${finalTax}, Total=${finalTotal} (was ${currentTotal})`);
    } else {
      console.log(`Skipped Bill ${b.billNumber}: already exclusive (Total=${currentTotal})`);
    }
  }
}
main().finally(() => prisma.$disconnect());
