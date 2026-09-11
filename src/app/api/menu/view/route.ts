import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { unstable_cache } from "next/cache";

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

    const getCachedMenu = async (cId: string) => {
      return await unstable_cache(
        async () => {
          return await prisma.item.findMany({
            where: { clerkId: cId },
            include: { category: true },
            orderBy: { updatedAt: "desc" },
          });
        },
        [`menu-view-${cId}`],
        { tags: [`menu-${cId}`], revalidate: 3600 }
      )();
    };

    const items = await getCachedMenu(effectiveId);

    return NextResponse.json(items);
  } catch (error) {
    console.error("MENU VIEW ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}
