const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Testing totalSellers count...");
    const totalSellers = await prisma.user.count({ where: { role: { not: "ADMIN" } } });
    console.log("totalSellers:", totalSellers);

    console.log("Testing totalBills count...");
    const totalBills = await prisma.billManager.count({ where: { isDeleted: false } });
    console.log("totalBills:", totalBills);

    console.log("Testing totalRevenue aggregate...");
    const totalRevenue = await prisma.billManager.aggregate({ 
      where: { isDeleted: false },
      _sum: { total: true } 
    });
    console.log("totalRevenue:", totalRevenue);

    console.log("Testing feature counts...");
    const upiCount = await prisma.businessProfile.count({ where: { upiQrEnabled: true } });
    const qrCount = await prisma.businessProfile.count({ where: { menuLinkEnabled: true } });
    console.log("upiCount:", upiCount, "qrCount:", qrCount);

    console.log("Testing activeToday groupBy...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeTodayGroups = await prisma.billManager.groupBy({
        by: ['clerkUserId'],
        where: { 
            createdAt: { gte: today },
            isDeleted: false
        },
        _count: {
            clerkUserId: true
        }
    });
    console.log("activeTodayGroups length:", activeTodayGroups.length);

    console.log("Testing sellers findMany...");
    const sellers = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      include: {
        profiles: {
            select: {
                businessName: true,
                upiQrEnabled: true,
                menuLinkEnabled: true,
                taxEnabled: true,
                enableKOTWithBill: true,
                aiScraperEnabled: true,
                excelImportEnabled: true,
                slug: true,
                publicId: true
            }
        },
        _count: { select: { bills: true } }
      },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 50,
    });
    console.log("sellers count:", sellers.length);

  } catch (err) {
    console.error("ERROR DURING TEST:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
