import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, zoneName, oldZone, newZone } = body;

    const profile = await prisma.businessProfile.findFirst({ where: { userId: effectiveId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    let currentZones = profile.zones || [];

    if (action === "add") {
      if (!zoneName || currentZones.includes(zoneName.toUpperCase())) {
        return NextResponse.json({ error: "Zone already exists or invalid name" }, { status: 400 });
      }
      currentZones.push(zoneName.toUpperCase());
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: { zones: currentZones }
      });
      return NextResponse.json({ success: true, zones: currentZones });
    }

    if (action === "edit") {
      if (!oldZone || !newZone) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
      // Update in BusinessProfile
      currentZones = currentZones.map(z => z === oldZone ? newZone.toUpperCase() : z);
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: { zones: currentZones }
      });

      // Update all items that have this oldZone
      const itemsWithZone = await prisma.item.findMany({
        where: { clerkId: effectiveId, zones: { has: oldZone } }
      });
      for (const item of itemsWithZone) {
        const updatedZones = item.zones.map(z => z === oldZone ? newZone.toUpperCase() : z);
        await prisma.item.update({
          where: { id: item.id },
          data: { zones: updatedZones }
        });
      }
      return NextResponse.json({ success: true, zones: currentZones });
    }

    if (action === "delete") {
      if (!zoneName) return NextResponse.json({ error: "Missing zoneName" }, { status: 400 });
      currentZones = currentZones.filter(z => z !== zoneName);
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: { zones: currentZones }
      });

      // Remove from all items
      const itemsWithZone = await prisma.item.findMany({
        where: { clerkId: effectiveId, zones: { has: zoneName } }
      });
      for (const item of itemsWithZone) {
        const updatedZones = item.zones.filter(z => z !== zoneName);
        await prisma.item.update({
          where: { id: item.id },
          data: { zones: updatedZones }
        });
      }
      return NextResponse.json({ success: true, zones: currentZones });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("ZONES API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
