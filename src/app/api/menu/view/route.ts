import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    let effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check for Admin Impersonation override via query parameter
    const { searchParams } = new URL(req.url);
    const queryAsUserId = searchParams.get("asUserId");
    if (queryAsUserId) {
      // Find the logged-in user to check if they are an ADMIN
      const { getAuthUser } = await import("@/lib/auth-utils");
      const loggedInUser = await getAuthUser();
      if (loggedInUser && loggedInUser.role === "ADMIN") {
        effectiveId = queryAsUserId;
        console.log(`👤 [Menu View Admin Impersonation] Admin logged in as: ${effectiveId}`);
      }
    }

    const items = await prisma.item.findMany({
      where: {
        clerkId: effectiveId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("MENU VIEW ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}
