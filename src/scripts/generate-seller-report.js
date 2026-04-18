import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function generateReport() {
  console.log("📊 Fetching Seller Reports (ESM Version)...\n");

  try {
    const sellers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "SELLER" },
          { role: "USER" },
        ],
      },
      include: {
        profiles: true,
        bills: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const reportData = sellers.map((seller) => {
      const profile = seller.profiles[0];
      const businessName = profile?.businessName || seller.name || "Unknown Business";
      const totalBills = seller.bills.length;
      const totalRevenue = seller.bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
      const lastBillDate = seller.bills.length > 0 ? seller.bills[0].createdAt : null;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isActive = lastBillDate && lastBillDate > sevenDaysAgo;

      return {
        clerkId: seller.clerkId || "N/A",
        businessName,
        email: seller.email,
        totalBills,
        totalRevenue: `₹${totalRevenue.toLocaleString()}`,
        lastBill: lastBillDate ? lastBillDate.toLocaleString() : "No bills yet",
        status: isActive ? "✅ ACTIVE" : "😴 INACTIVE",
        daysSinceLastBill: lastBillDate 
          ? Math.floor((new Date().getTime() - lastBillDate.getTime()) / (1000 * 60 * 60 * 24))
          : "N/A"
      };
    });

    reportData.sort((a, b) => {
        const revA = parseFloat(a.totalRevenue.replace(/[₹,]/g, ''));
        const revB = parseFloat(b.totalRevenue.replace(/[₹,]/g, ''));
        return revB - revA;
    });

    console.table(reportData);
    
    console.log("\n📈 Summary Statistics:");
    console.log(`Total Merchants: ${reportData.length}`);
    console.log(`Active (last 7 days): ${reportData.filter(s => s.status === "✅ ACTIVE").length}`);
    console.log(`Inactive: ${reportData.filter(s => s.status === "😴 INACTIVE").length}`);

  } catch (error) {
    console.error("Error generating report:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateReport();
