import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const admin = await getAuthUser();
    
    // Check if the requester is logged in and is an ADMIN
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Lookup merchant by email
    const merchant = await prisma.user.findUnique({
      where: { email },
      select: { clerkId: true, name: true }
    });

    if (!merchant) {
      return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
    }

    if (!merchant.clerkId) {
       return NextResponse.json({ error: "User exists but has no valid Clerk ID" }, { status: 400 });
    }

    // Find all bill IDs for this merchant
    const bills = await prisma.billManager.findMany({
      where: { clerkUserId: merchant.clerkId },
      select: { id: true }
    });

    const billIds = bills.map(b => b.id);

    if (billIds.length === 0) {
      return NextResponse.json({ message: "No bills found for this user", count: 0 }, { status: 200 });
    }

    // Delete Payments first to avoid orphaned records
    await prisma.payment.deleteMany({
      where: { billId: { in: billIds } }
    });

    // Delete Bills
    const deleted = await prisma.billManager.deleteMany({
      where: { clerkUserId: merchant.clerkId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deleted.count} bills for ${merchant.name || email}`,
      count: deleted.count 
    }, { status: 200 });

  } catch (error: any) {
    console.error("ADMIN DELETE BILLS ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to delete bills" }, { status: 500 });
  }
}
