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

    // priority 1: Assigned Permissions from Auth object (JWT or Clerk-linked staff)
    let finalAllowed: string[] = authUser.permissions || [];

    // priority 2: If it's an OWNER (ADMIN/SELLER/OWNER), give them full access
    const isOwner = authUser.type === "OWNER" || authUser.type === "ADMIN" || authUser.type === "SELLER";
    
    if (isOwner) {
      finalAllowed = [
        "/dashboard", 
        "/dashboard/billing/checkout", 
        "/dashboard/tables", 
        "/dashboard/billing", 
        "/dashboard/workflow",
        "/dashboard/menu/view", 
        "/dashboard/menu-editor",
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
    } 
    // priority 3: Default fallback for staff if no permissions assigned
    else {
      if (finalAllowed.length === 0) {
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

    // Always ensure /dashboard and /dashboard/help are available
    const finalPaths = [...new Set(["/dashboard", "/dashboard/help", ...finalAllowed])];

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
