
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: partyId } = await params;

    // Verify party ownership
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      select: { createdBy: true, phone: true }
    });

    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    if (party.createdBy !== effectiveId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch bills for this party
    // We search by partyId OR by phone (to capture bills created before party conversion or with just phone)
    const bills = await prisma.billManager.findMany({
      where: {
        clerkUserId: effectiveId,
        isDeleted: false,
        OR: [
          { partyId: partyId },
          { customerPhone: party.phone }
        ]
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bills });
  } catch (err) {
    console.error("PARTY BILLS FETCH ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
