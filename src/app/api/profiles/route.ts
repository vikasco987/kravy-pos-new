import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profiles = await prisma.businessProfile.findMany({
      where: { userId: effectiveId },
      orderBy: { createdAt: 'asc' }
    });

    const user = await prisma.user.findUnique({
      where: { clerkId: effectiveId }
    });

    return NextResponse.json({
        profiles,
        enableMultipleProfiles: user?.enableMultipleProfiles || false
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/profiles error:", error);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
}
