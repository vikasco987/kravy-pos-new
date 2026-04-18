import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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
    const worksheet = workbook.addWorksheet("Merchant Activity");

    // Columns
    worksheet.columns = [
      { header: "S.No", key: "id", width: 8 },
      { header: "Business Name", key: "business", width: 35 },
      { header: "Contact Email", key: "email", width: 35 },
      { header: "Bills", key: "bills", width: 12 },
      { header: "Revenue (INR)", key: "revenue", width: 15 },
      { header: "Last Active", key: "lastActive", width: 25 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Style Header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };

    // Add Data
    sellers.forEach((seller, i) => {
      const profile = seller.profiles[0];
      const totalBills = seller.bills.length;
      const totalRevenue = seller.bills.reduce((sum, b) => sum + (b.total || 0), 0);
      const lastBill = seller.bills[0]?.createdAt;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isActive = lastBill && lastBill > sevenDaysAgo;

      const row = worksheet.addRow({
        id: i + 1,
        business: profile?.businessName || seller.name || "Unknown",
        email: seller.email,
        bills: totalBills,
        revenue: totalRevenue,
        lastActive: lastBill ? lastBill.toLocaleString() : "N/A",
        status: isActive ? "ACTIVE" : "INACTIVE",
      });

      // Status Color
      const statusCell = row.getCell("status");
      if (isActive) {
        statusCell.font = { bold: true, color: { argb: "FF065F46" } };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
      } else {
        statusCell.font = { color: { argb: "FF991B1B" } };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Merchant_Report_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err) {
    console.error("EXCEL EXPORT ERROR:", err);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
