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

    // Fetch all items for the user
    const items = await prisma.item.findMany({
      where: {
        clerkId: userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (!items.length) {
      return NextResponse.json({ error: "No items found to export" }, { status: 404 });
    }

    // Transform data for Excel
    const data = items.map((item) => ({
      "Item Name": item.name,
      "Category": item.category?.name || "N/A",
      "Price": item.price || 0,
      "Selling Price": item.sellingPrice || 0,
      "GST %": item.gst || 0,
      "Unit": item.unit || "pcs",
      "Barcode": item.barcode || "N/A",
      "Is Active": item.isActive ? "Yes" : "No",
      "Is Veg": item.isVeg ? "Yes" : "No",
      "Rating": item.rating || 4.5,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return as file download
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Kravy_Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("INVENTORY EXCEL EXPORT ERROR:", error);
    return NextResponse.json({ error: "Failed to export inventory" }, { status: 500 });
  }
}
