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

    // priority 4: Expand mobile app group permissions into actual URL paths
    const PERMISSION_MAPPING: Record<string, string[]> = {
      "Dashboard Permissions": ["/dashboard"],
      "Order & Billing Permissions": ["/dashboard/billing/checkout", "/dashboard/workflow", "/dashboard/tables"],
      "Invoices & Receipts": ["/dashboard/billing", "/dashboard/billing/deleted"],
      "Customer Permissions": ["/dashboard/parties"],
      "Menu & Items Permissions": ["/dashboard/menu/view", "/dashboard/menu-editor", "/dashboard/menu/addons", "/dashboard/menu/upload", "/dashboard/store-item-upload", "/dashboard/menu/edit", "/dashboard/inventory"],
      "AI Intelligence Tools": ["/dashboard/ai-scraper"],
      "Report Permissions": ["/dashboard/reports/sales/daily", "/dashboard/reports/gst"],
      "Settings Permissions": ["/dashboard/profile", "/dashboard/settings", "/dashboard/settings/tax", "/dashboard/staff"]
    };

    // Include original permissions (for mobile app logic) AND expand them (for website sidebar)
    let expandedAllowed: string[] = [...finalAllowed]; 
    finalAllowed.forEach(p => {
      if (PERMISSION_MAPPING[p]) {
        expandedAllowed = [...expandedAllowed, ...PERMISSION_MAPPING[p]];
      }
    });

    // Ensure uniqueness, and include the expanded paths
    const finalPaths = [...new Set(expandedAllowed)];

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
