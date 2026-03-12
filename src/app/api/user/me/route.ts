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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const permission = await prisma.rolePermission.findUnique({
      where: { role: user.role }
    });

    let allowedPaths: string[] = [];
    
    // Default fallback rules if no dynamic config exists in DB yet
    if (permission) {
      allowedPaths = permission.allowedPaths;
    } else {
      if (user.role === "ADMIN") {
        allowedPaths = ["*"];
      } else if (user.role === "SELLER") {
        allowedPaths = ["/dashboard/inventory", "/dashboard/settings", "/dashboard/billing/deleted", "/dashboard/menu/edit", "/dashboard/menu/upload", "/dashboard/store-item-upload"];
      } else {
        allowedPaths = [];
      }
    }

    return NextResponse.json({ ...user, allowedPaths });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
