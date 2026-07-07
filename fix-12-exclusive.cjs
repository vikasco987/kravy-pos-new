const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const bills = await prisma.billManager.findMany({
    where: { 
      clerkUserId: clerkId, 
      createdAt: { gte: today },
      isDeleted: false
    }
  });
  
  console.log(`Found ${bills.length} bills today for user.`);
  
  for (const b of bills) {
    if (!b.billNumber.endsWith('0012') && !b.billNumber.endsWith('0013')) {
       // Only process the new ones that might be wrong
       continue;
    }
    
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
    
    await prisma.billManager.update({
      where: { id: b.id },
      data: {
        subtotal: newSubtotal,
        tax: finalTax,
        total: finalTotal,
        items: newItems
      }
    });
    console.log(`Updated Bill ${b.billNumber}: Subtotal=${newSubtotal}, Tax=${finalTax}, Total=${finalTotal}`);
  }
}
main().finally(() => prisma.$disconnect());
