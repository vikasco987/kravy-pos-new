import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const permission = await (prisma as any).rolePermission.findUnique({
      where: { role: user.role }
    });

    // Priority 1: Per-user specific allowedPaths (Staff settings)
    let finalAllowed: string[] = [];
    if ((user as any).allowedPaths && (user as any).allowedPaths.length > 0) {
      finalAllowed = (user as any).allowedPaths;
    } 
    // Priority 2: Role Based permissions from DB
    else if (permission && permission.allowedPaths && permission.allowedPaths.length > 0) {
      finalAllowed = permission.allowedPaths;
    } 
    // Priority 3: Hardcoded Fallbacks
    else {
      if (user.role === "ADMIN") finalAllowed = ["*"];
      else if (user.role === "SELLER") finalAllowed = [
        "/dashboard", 
        "/dashboard/billing/checkout", 
        "/dashboard/tables", 
        "/dashboard/billing", 
        "/dashboard/workflow",
        "/dashboard/menu/view", 
        "/dashboard/menu/upload", 
        "/dashboard/store-item-upload", 
        "/dashboard/menu/edit", 
        "/dashboard/parties",
        "/dashboard/staff",
        "/dashboard/inventory", 
        "/dashboard/qr-orders",
        "/dashboard/combos",
        "/dashboard/gallery",
        "/dashboard/profile",
        "/dashboard/settings", 
        "/dashboard/settings/tax",
        "/dashboard/billing/deleted",
        "/dashboard/reports/sales/daily",
        "/dashboard/reports/products",
        "/dashboard/reports/bills",
        "/dashboard/reports/expenses"
      ];
      else finalAllowed = [
        "/dashboard", 
        "/dashboard/billing/checkout", 
        "/dashboard/tables", 
        "/dashboard/billing", 
        "/dashboard/workflow",
        "/dashboard/menu/view", 
        "/dashboard/menu/upload", 
        "/dashboard/store-item-upload", 
        "/dashboard/menu/edit", 
        "/dashboard/parties",
        "/dashboard/staff",
        "/dashboard/inventory", 
        "/dashboard/qr-orders",
        "/dashboard/combos",
        "/dashboard/gallery",
        "/dashboard/profile",
        "/dashboard/settings", 
        "/dashboard/settings/tax",
        "/dashboard/billing/deleted",
        "/dashboard/reports/sales/daily",
        "/dashboard/reports/products",
        "/dashboard/reports/bills",
        "/dashboard/reports/expenses"
      ]; 
    }

    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clerkId: user.clerkId,
        ownerId: (user as any).ownerId,
    };

    // Always ensure /dashboard and /dashboard/help are available for UI shell stability
    const finalPaths = [...new Set(["/dashboard", "/dashboard/help", ...finalAllowed])];

    return NextResponse.json({ ...safeUser, allowedPaths: finalPaths });
  } catch (error) {
    console.error("USER/ME ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch user: " + String(error) },
      { status: 500 }
    );
  }
}
