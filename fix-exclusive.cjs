const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'custom_1780926122156_h2bai';
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: clerkId, createdAt: { gte: today } },
    select: { id: true, subtotal: true, tax: true, total: true, items: true }
  });
  
  for (const b of bills) {
    let newSubtotal = 0;
    let newTax = 0;
    
    // Update items taxStatus and calculate new totals
    const newItems = b.items.map(item => {
      item.taxStatus = "Without Tax";
      
      const itemGross = item.qty * item.rate;
      const itemGst = itemGross * (item.gst || 0) / 100;
      
      newSubtotal += itemGross;
      newTax += itemGst;
      
      return item;
    });
    
    const newTotal = newSubtotal + newTax;
    
    await prisma.billManager.update({
      where: { id: b.id },
      data: {
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
        items: newItems
      }
    });
    console.log(`Updated Bill ${b.id} to EXCLUSIVE: Subtotal=${newSubtotal}, Tax=${newTax}, Total=${newTotal}`);
  }
}
main().finally(() => prisma.$disconnect());
