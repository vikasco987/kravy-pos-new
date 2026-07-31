import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.businessProfile.findFirst({ where: { userId: effectiveId } });
    const zones = profile?.zones || ["MAIN KITCHEN", "BAR", "GRILL", "BAKERY", "COUNTER"];
    return NextResponse.json({ success: true, zones });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
      const upperOldZone = oldZone.toUpperCase();
      // Update in BusinessProfile
      currentZones = currentZones.map(z => z.toUpperCase() === upperOldZone ? newZone.toUpperCase() : z);
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: { zones: currentZones }
      });

      // Update all items that have this oldZone
      const itemsWithZone = await prisma.item.findMany({
        where: { clerkId: effectiveId }
      });
      for (const item of itemsWithZone) {
        if (!item.zones?.some(z => z.toUpperCase() === upperOldZone)) continue;
        const updatedZones = item.zones.map(z => z.toUpperCase() === upperOldZone ? newZone.toUpperCase() : z);
        await prisma.item.update({
          where: { id: item.id },
          data: { zones: updatedZones }
        });
      }

      // Update tables that have this oldZone
      const tablesWithZone = await prisma.table.findMany({
        where: { clerkUserId: effectiveId }
      });
      for (const table of tablesWithZone) {
        if (table.zone?.toUpperCase() === upperOldZone) {
          await prisma.table.update({
            where: { id: table.id },
            data: { zone: newZone.toUpperCase() }
          });
        }
      }

      return NextResponse.json({ success: true, zones: currentZones });
    }

    if (action === "delete") {
      if (!zoneName) return NextResponse.json({ error: "Missing zoneName" }, { status: 400 });
      const upperZoneName = zoneName.toUpperCase();
      currentZones = currentZones.filter(z => z.toUpperCase() !== upperZoneName);
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: { zones: currentZones }
      });

      // Remove from all items
      // Check both exact match and uppercase match to be safe
      const itemsWithZone = await prisma.item.findMany({
        where: { clerkId: effectiveId }
      });
      for (const item of itemsWithZone) {
        if (!item.zones?.some(z => z.toUpperCase() === upperZoneName)) continue;
        const updatedZones = item.zones.filter(z => z.toUpperCase() !== upperZoneName);
        await prisma.item.update({
          where: { id: item.id },
          data: { zones: updatedZones }
        });
      }

      // Reset tables with this zone back to Default
      const tablesWithZone = await prisma.table.findMany({
        where: { clerkUserId: effectiveId }
      });
      for (const table of tablesWithZone) {
        if (table.zone?.toUpperCase() === upperZoneName) {
          await prisma.table.update({
            where: { id: table.id },
            data: { zone: "Default" }
          });
        }
      }

      return NextResponse.json({ success: true, zones: currentZones });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("ZONES API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
