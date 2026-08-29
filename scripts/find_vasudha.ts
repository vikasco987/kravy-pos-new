import prisma from "../src/lib/prisma";

async function main() {
  const profiles = await prisma.businessProfile.findMany({
    where: {
      businessName: {
        contains: "Vasudha",
        mode: "insensitive"
      }
    }
  });

  if (profiles.length === 0) {
      console.log("No Vasudha found");
      return;
  }

  for (const profile of profiles) {
    const userId = profile.userId;
    console.log(`\nFetching TODAY'S bills for userId: ${userId} (${profile.businessName})`);

    // Today in IST
    const start = new Date(Date.UTC(2026, 7, 26, 0, 0, 0, 0)); // Aug 26 2026 00:00:00
    start.setMinutes(start.getMinutes() - 330);
    const end = new Date(Date.UTC(2026, 7, 26, 23, 59, 59, 999));
    end.setMinutes(end.getMinutes() - 330);

    const bills = await prisma.billManager.findMany({
      where: { 
          clerkUserId: userId,
          createdAt: {
              gte: start,
              lte: end
          }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    let totalSales = 0;
    let itemsTotalSum = 0;
    let discountSum = 0;
    let taxSum = 0;
    let packagingSum = 0;
    let deliverySum = 0;
    let heldSum = 0;
    let deletedSum = 0;
    let cancelledSum = 0;
    let amountPaidSum = 0;
    let balanceDueSum = 0;

    bills.forEach(bill => {
        if (bill.isDeleted) {
            deletedSum += bill.total;
        } else if (bill.isHeld) {
            heldSum += bill.total;
        } else if (bill.paymentStatus.toUpperCase() === "CANCELLED") {
            cancelledSum += bill.total;
        } else {
            totalSales += bill.total;
            amountPaidSum += (bill.amountPaid || 0);
            balanceDueSum += (bill.balanceDue || 0);
            
            let itemsTotal = 0;
            try {
                if (Array.isArray(bill.items)) {
                    bill.items.forEach((item: any) => {
                        const qty = Number(item.qty || item.quantity) || 0;
                        const rate = Number(item.rate || item.price) || 0;
                        itemsTotal += (qty * rate);
                    });
                }
            } catch (e) {}
            
            itemsTotalSum += itemsTotal;
            discountSum += (bill.discountAmount || 0);
            taxSum += (bill.tax || 0);
            packagingSum += ((bill.packagingCharges || 0) + (bill.packagingGst || 0));
            deliverySum += ((bill.deliveryCharges || 0) + (bill.deliveryGst || 0));
        }
    });

    console.log(`Total Bills Today: ${bills.length}`);
    console.log(`Deleted Bills Sales: ${deletedSum}`);
    console.log(`Held Bills Sales: ${heldSum}`);
    console.log(`Cancelled Bills Sales: ${cancelledSum}`);
    console.log(`---------------------------------`);
    console.log(`Dashboard Total Sales (b.total sum): ${totalSales}`);
    console.log(`Amount Paid Sum: ${amountPaidSum}`);
    console.log(`Balance Due (Udhar) Sum: ${balanceDueSum}`);
    console.log(`Items (qty * rate) Sum: ${itemsTotalSum}`);
    console.log(`Total Discounts: ${discountSum}`);
    console.log(`Total Tax: ${taxSum}`);
    console.log(`Total Packaging: ${packagingSum}`);
    console.log(`Total Delivery: ${deliverySum}`);
    console.log(`Difference (Items vs Dashboard): ${itemsTotalSum - totalSales}`);
    
    // Also log any bill where amountPaid > total
    for(const b of bills) {
        if(!b.isDeleted && !b.isHeld && b.paymentStatus.toUpperCase() !== "CANCELLED") {
            if ((b.amountPaid || 0) > b.total) {
                console.log(`Mismatch AmountPaid on Bill ${b.billNumber}: Total=${b.total}, AmountPaid=${b.amountPaid}, PaymentMode=${b.paymentMode}`);
            }
        }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

