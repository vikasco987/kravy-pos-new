import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return new NextResponse("Missing date range", { status: 400 });
    }

    // 1. Fetch Business Profile to check if GST is enabled
    const profile = await prisma.businessProfile.findUnique({
      where: { userId },
    });

    if (!profile?.taxEnabled) {
      return NextResponse.json({ error: "GST is not enabled" }, { status: 403 });
    }

    // 2. Fetch all bills for the user in the date range
    const bills = await prisma.billManager.findMany({
      where: {
        clerkUserId: userId,
        isDeleted: false,
        isHeld: false,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Process data for reports
    const gstr1: any[] = [];
    const hsnMap: Map<string, any> = new Map();
    const dailyMap: Map<string, any> = new Map();

    let totalTaxableAll = 0;
    let totalCgstAll = 0;
    let totalSgstAll = 0;
    let totalIgstAll = 0;
    let totalGstAll = 0;

    const businessState = profile?.state?.trim().toLowerCase() || "";

    bills.forEach((bill) => {
      const dateStr = bill.createdAt.toISOString().split("T")[0];
      const billItems = bill.items as any[];
      const billPlaceOfSupply = bill.placeOfSupply?.trim().toLowerCase() || businessState;
      const isInterState = billPlaceOfSupply !== "" && businessState !== "" && billPlaceOfSupply !== businessState;

      let billTaxable = 0;
      let billCgst = 0;
      let billSgst = 0;
      let billIgst = 0;
      let billGst = 0;

      billItems.forEach((item) => {
        const rate = Number(item.gst) || 0;
        const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
        let taxable = 0;
        let gst = 0;

        if (item.taxStatus === "With Tax") {
          taxable = gross / (1 + rate / 100);
          gst = gross - taxable;
        } else {
          taxable = gross;
          gst = (gross * rate) / 100;
        }

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isInterState) {
          igst = gst;
        } else {
          cgst = gst / 2;
          sgst = gst / 2;
        }

        billTaxable += taxable;
        billCgst += cgst;
        billSgst += sgst;
        billIgst += igst;
        billGst += gst;

        // HSN Summary
        const hsn = item.hsnCode || "NA";
        if (!hsnMap.has(hsn)) {
          hsnMap.set(hsn, { hsn, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, qty: 0 });
        }
        const hsnData = hsnMap.get(hsn);
        hsnData.taxable += taxable;
        hsnData.cgst += cgst;
        hsnData.sgst += sgst;
        hsnData.igst += igst;
        hsnData.totalGst += gst;
        hsnData.qty += Number(item.qty) || 0;
      });

      // GSTR-1 Entry
      gstr1.push({
        billNumber: bill.billNumber,
        date: bill.createdAt,
        customerName: bill.customerName || "Walk-in",
        customerPhone: bill.customerPhone || null,
        partyId: bill.partyId || null,
        buyerGSTIN: bill.buyerGSTIN || "-",
        placeOfSupply: bill.placeOfSupply || profile?.state || "-",
        taxable: Number(billTaxable.toFixed(2)),
        cgst: Number(billCgst.toFixed(2)),
        sgst: Number(billSgst.toFixed(2)),
        igst: Number(billIgst.toFixed(2)),
        totalGst: Number(billGst.toFixed(2)),
        grandTotal: bill.total,
        paymentMode: bill.paymentMode,
        type: bill.buyerGSTIN ? "B2B" : "B2C",
      });

      // Daily Summary
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { date: dateStr, bills: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0 });
      }
      const dailyData = dailyMap.get(dateStr);
      dailyData.bills += 1;
      dailyData.gross += bill.total;
      dailyData.taxable += billTaxable;
      dailyData.cgst += billCgst;
      dailyData.sgst += billSgst;
      dailyData.igst += billIgst;
      dailyData.totalGst += billGst;

      totalTaxableAll += billTaxable;
      totalCgstAll += billCgst;
      totalSgstAll += billSgst;
      totalIgstAll += billIgst;
      totalGstAll += billGst;
    });

    const hsnSummary = Array.from(hsnMap.values()).map(h => ({
      ...h,
      taxable: Number(h.taxable.toFixed(2)),
      cgst: Number(h.cgst.toFixed(2)),
      sgst: Number(h.sgst.toFixed(2)),
      igst: Number(h.igst.toFixed(2)),
      totalGst: Number(h.totalGst.toFixed(2)),
    }));

    const dailyTax = Array.from(dailyMap.values()).map(d => ({
      ...d,
      gross: Number(d.gross.toFixed(2)),
      taxable: Number(d.taxable.toFixed(2)),
      cgst: Number(d.cgst.toFixed(2)),
      sgst: Number(d.sgst.toFixed(2)),
      igst: Number(d.igst.toFixed(2)),
      totalGst: Number(d.totalGst.toFixed(2)),
    })).sort((a, b) => b.date.localeCompare(a.date));

    const gstr3b = {
      taxable: Number(totalTaxableAll.toFixed(2)),
      cgst: Number(totalCgstAll.toFixed(2)),
      sgst: Number(totalSgstAll.toFixed(2)),
      igst: Number(totalIgstAll.toFixed(2)),
      totalGst: Number(totalGstAll.toFixed(2)),
    };

    return NextResponse.json({
      gstr1,
      gstr3b,
      hsnSummary,
      dailyTax,
    });
  } catch (error) {
    console.error("GST REPORT ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
