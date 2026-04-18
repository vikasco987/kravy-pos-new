import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const prisma = new PrismaClient();

async function generateExcel() {
  console.log("🚀 Initializing Colorful Excel Report Generation...");

  try {
    const sellers = await prisma.user.findMany({
      where: {
        OR: [{ role: "SELLER" }, { role: "USER" }],
      },
      include: {
        profiles: true,
        bills: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Merchant Activity Report");

    // Add Header Row
    worksheet.columns = [
      { header: "No.", key: "index", width: 5 },
      { header: "Business Name", key: "businessName", width: 30 },
      { header: "Owner Email", key: "email", width: 35 },
      { header: "Total Bills", key: "totalBills", width: 12 },
      { header: "Total Revenue (₹)", key: "revenue", width: 20 },
      { header: "Last Active", key: "lastBill", width: 25 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Style Header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }, // Indigo Blue
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add Data Rows
    sellers.forEach((seller, i) => {
      const profile = seller.profiles[0];
      const businessName = profile?.businessName || seller.name || "Unknown Business";
      const totalBills = seller.bills.length;
      const totalRevenue = seller.bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
      const lastBillDate = seller.bills.length > 0 ? seller.bills[0].createdAt : null;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isActive = lastBillDate && lastBillDate > sevenDaysAgo;

      const row = worksheet.addRow({
        index: i + 1,
        businessName,
        email: seller.email,
        totalBills,
        revenue: totalRevenue,
        lastBill: lastBillDate ? lastBillDate.toLocaleString() : "No bills yet",
        status: isActive ? "ACTIVE" : "INACTIVE",
      });

      // Style based on status
      const statusCell = row.getCell("status");
      if (isActive) {
        statusCell.font = { bold: true, color: { argb: "FF065F46" } }; // Dark Green
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD1FAE5" }, // Light Green
        };
      } else {
        statusCell.font = { color: { argb: "FF991B1B" } }; // Dark Red
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEE2E2" }, // Light Red
        };
      }

      // Add borders to cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const fileName = `Kravy_Merchant_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const exportPath = path.join(process.cwd(), fileName);
    
    await workbook.xlsx.writeFile(exportPath);

    console.log(`\n✅ Report Generated Successfully!`);
    console.log(`📍 File Location: ${exportPath}`);
    console.log(`📊 Total Merchants Exported: ${sellers.length}`);

  } catch (error) {
    console.error("❌ Excel Export Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateExcel();
