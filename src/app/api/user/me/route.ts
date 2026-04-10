import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // priority 1: Assigned Permissions from Auth object (User model or Staff model)
    let finalAllowed: string[] = authUser.permissions || [];

    // priority 2: If no individual permissions, check GLOBAL Role-based permissions
    if (finalAllowed.length === 0) {
      const globalPerms = await (prisma as any).rolePermission.findUnique({
        where: { role: authUser.role }
      });
      if (globalPerms) {
        finalAllowed = globalPerms.allowedPaths;
      }
    }

    // priority 3: Fallback Hardcoded Defaults (if still empty)
    const isPrivileged = authUser.type === "OWNER" || authUser.type === "ADMIN" || authUser.type === "SELLER";
    
    if (finalAllowed.length === 0) {
      if (isPrivileged) {
        finalAllowed = [
          "/dashboard", 
          "/dashboard/billing/checkout", 
          "/dashboard/tables", 
          "/dashboard/billing", 
          "/dashboard/workflow",
          "/dashboard/menu/view", 
          "/dashboard/menu-editor",
          "/dashboard/menu/addons",
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
          "/dashboard/reports/gst",
          "/dashboard/ai-scraper"
        ];
      } else {
        finalAllowed = [
          "/dashboard", 
          "/dashboard/billing/checkout", 
          "/dashboard/tables", 
          "/dashboard/billing", 
          "/dashboard/menu/view", 
          "/dashboard/qr-orders",
          "/dashboard/help"
        ];
      }
    }

    // Ensure uniqueness, but don't force /dashboard if permissions are explicitly set
    const finalPaths = [...new Set(finalAllowed)];

    return NextResponse.json({ 
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.type, // Maintain original role for frontend
        businessId: authUser.businessId,
        allowedPaths: finalPaths,
        uiPreferences: {} // Default empty for now
    });

  } catch (error) {
    console.error("USER/ME ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch user: " + String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { uiPreferences } = body;

    // Only update if it's a Clerk user for now (Standard User model)
    if (authUser.type === "OWNER") {
        await (prisma.user as any).update({
          where: { id: authUser.id },
          data: {
            uiPreferences: uiPreferences ?? {}
          }
        });
    }

    return NextResponse.json({ success: true, uiPreferences: uiPreferences || {} });
  } catch (error) {
    console.error("USER/ME PATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
