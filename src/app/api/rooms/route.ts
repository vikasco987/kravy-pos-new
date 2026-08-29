import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ======================================================
   GET ALL ROOMS (Self-heals default rooms if 0 exist)
====================================================== */
export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let rooms = await (prisma as any).hotelRoom.findMany({
            where: { clerkUserId: effectiveId, isActive: true },
            orderBy: { roomNumber: "asc" }
        });

        // If no rooms exist yet, seed default rooms for instant demo
        if (rooms.length === 0) {
            const defaultRooms = [
                { roomNumber: "101", roomType: "Deluxe Single", floor: "1st Floor", pricePerNight: 1200, status: "AVAILABLE", amenities: ["AC", "TV", "WiFi", "King Bed"] },
                { roomNumber: "102", roomType: "Deluxe Double", floor: "1st Floor", pricePerNight: 1800, status: "AVAILABLE", amenities: ["AC", "TV", "WiFi", "Geyser", "Double Bed"] },
                { roomNumber: "103", roomType: "Standard Single", floor: "1st Floor", pricePerNight: 1000, status: "AVAILABLE", amenities: ["TV", "WiFi", "Single Bed"] },
                { roomNumber: "201", roomType: "Super Deluxe", floor: "2nd Floor", pricePerNight: 2500, status: "AVAILABLE", amenities: ["AC", "Smart TV", "WiFi", "Mini Fridge", "Balcony"] },
                { roomNumber: "202", roomType: "Super Deluxe", floor: "2nd Floor", pricePerNight: 2500, status: "AVAILABLE", amenities: ["AC", "Smart TV", "WiFi", "Mini Fridge", "Balcony"] },
                { roomNumber: "301", roomType: "Presidential Suite", floor: "3rd Floor", pricePerNight: 4500, status: "AVAILABLE", amenities: ["AC", "Jacuzzi", "Smart TV", "WiFi", "Living Room", "King Suite"] },
            ];

            for (const r of defaultRooms) {
                try {
                    await (prisma as any).hotelRoom.create({
                        data: {
                            ...r,
                            clerkUserId: effectiveId
                        }
                    });
                } catch (e) {
                    console.warn("Room seed skip:", r.roomNumber);
                }
            }

            rooms = await (prisma as any).hotelRoom.findMany({
                where: { clerkUserId: effectiveId, isActive: true },
                orderBy: { roomNumber: "asc" }
            });
        }

        return NextResponse.json(rooms);
    } catch (error: any) {
        console.error("GET_ROOMS_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}

/* ======================================================
   POST: CREATE A NEW ROOM
====================================================== */
export async function POST(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { roomNumber, roomType, floor, pricePerNight, amenities } = body;

        if (!roomNumber) {
            return NextResponse.json({ error: "Room number is required" }, { status: 400 });
        }

        const newRoom = await (prisma as any).hotelRoom.create({
            data: {
                clerkUserId: effectiveId,
                roomNumber: String(roomNumber).trim(),
                roomType: roomType || "Standard",
                floor: floor || "1st Floor",
                pricePerNight: parseFloat(pricePerNight) || 1200,
                amenities: Array.isArray(amenities) ? amenities : ["AC", "TV", "WiFi"],
                status: "AVAILABLE"
            }
        });

        return NextResponse.json(newRoom, { status: 201 });
    } catch (error: any) {
        console.error("CREATE_ROOM_ERROR:", error);
        return NextResponse.json({ error: error.message || "Failed to create room" }, { status: 500 });
    }
}

/* ======================================================
   PUT: UPDATE ROOM STATUS / DETAILS
====================================================== */
export async function PUT(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, roomNumber, roomType, floor, pricePerNight, status, amenities } = body;

        if (!id) return NextResponse.json({ error: "Room ID required" }, { status: 400 });

        const updatedRoom = await (prisma as any).hotelRoom.update({
            where: { id },
            data: {
                ...(roomNumber ? { roomNumber: String(roomNumber).trim() } : {}),
                ...(roomType ? { roomType } : {}),
                ...(floor ? { floor } : {}),
                ...(pricePerNight !== undefined ? { pricePerNight: parseFloat(pricePerNight) } : {}),
                ...(status ? { status } : {}),
                ...(amenities ? { amenities } : {}),
                ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
            }
        });

        return NextResponse.json(updatedRoom);
    } catch (error: any) {
        console.error("UPDATE_ROOM_ERROR:", error);
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }
}

/* ======================================================
   DELETE: REMOVE ROOM
====================================================== */
export async function DELETE(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Room ID required" }, { status: 400 });

        await (prisma as any).hotelRoom.update({
            where: { id },
            data: { isActive: false }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE_ROOM_ERROR:", error);
        return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }
}
