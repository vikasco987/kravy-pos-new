import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const effectiveClerkId = await getEffectiveClerkId();
    if (!effectiveClerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ items: [], bills: [], parties: [] });
    }

    // Parallel searches for maximum speed
    const [items, bills, parties] = await Promise.all([
      prisma.item.findMany({
        where: {
          clerkId: effectiveClerkId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { barcode: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, name: true, price: true, currentStock: true, barcode: true },
      }),
      prisma.billManager.findMany({
        where: {
          clerkUserId: effectiveClerkId,
          billNumber: { contains: query, mode: "insensitive" },
        },
        take: 3,
        select: { id: true, billNumber: true, total: true, createdAt: true },
      }),
      prisma.party.findMany({
        where: {
          createdBy: effectiveClerkId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: { id: true, name: true, phone: true },
      }),
    ]);

    return NextResponse.json({ items, bills, parties });
  } catch (error) {
    console.error("GLOBAL SEARCH ERROR:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
