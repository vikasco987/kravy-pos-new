import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleNo, fuelType, rate, saleAmount, volume } = body;

    if (!fuelType || !rate || !saleAmount || !volume) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate Bill Number
    const lastBill = await prisma.fuelBill.findFirst({
      where: { clerkUserId: effectiveId },
      orderBy: { createdAt: "desc" },
    });

    let newBillNumber = "FB-1";
    if (lastBill && lastBill.billNumber) {
      const match = lastBill.billNumber.match(/FB-(\d+)/);
      if (match) {
        newBillNumber = `FB-${parseInt(match[1]) + 1}`;
      }
    }

    const bill = await prisma.fuelBill.create({
      data: {
        clerkUserId: effectiveId,
        billNumber: newBillNumber,
        vehicleNo: vehicleNo || null,
        fuelType,
        rate: parseFloat(rate),
        saleAmount: parseFloat(saleAmount),
        volume: parseFloat(volume),
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("POST /api/fuel-bills error:", error);
    return NextResponse.json({ error: "Failed to create fuel bill" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bills = await prisma.fuelBill.findMany({
      where: { clerkUserId: effectiveId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(bills, { status: 200 });
  } catch (error) {
    console.error("GET /api/fuel-bills error:", error);
    return NextResponse.json({ error: "Failed to fetch fuel bills" }, { status: 500 });
  }
}
