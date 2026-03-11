import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all bills for the user
    const bills = await prisma.billManager.findMany({
      where: {
        clerkUserId: userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!bills.length) {
      return NextResponse.json({ error: "No bills found to export" }, { status: 404 });
    }

    // Transform data for Excel
    const data = bills.map((bill) => ({
      "Bill Number": bill.billNumber,
      "Date": new Date(bill.createdAt).toLocaleString("en-IN"),
      "Customer Name": bill.customerName || "N/A",
      "Customer Phone": bill.customerPhone || "N/A",
      "Subtotal": bill.subtotal,
      "Tax": bill.tax || 0,
      "Total": bill.total,
      "Payment Mode": bill.paymentMode,
      "Status": bill.paymentStatus,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return as file download
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Kravy_Bills_Export_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("EXCEL EXPORT ERROR:", error);
    return NextResponse.json({ error: "Failed to export bills" }, { status: 500 });
  }
}
