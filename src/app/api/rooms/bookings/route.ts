import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ======================================================
   GET ALL BOOKINGS / ACTIVE CHECK-INS
====================================================== */
export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // CHECKED_IN, CHECKED_OUT, or ALL
        const roomNumber = searchParams.get("roomNumber");

        const whereClause: any = { clerkUserId: effectiveId };
        if (status && status !== "ALL") whereClause.status = status;
        if (roomNumber) whereClause.roomNumber = roomNumber;

        const bookings = await (prisma as any).hotelBooking.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(bookings);
    } catch (error: any) {
        console.error("GET_BOOKINGS_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

/* ======================================================
   POST: CREATE NEW CHECK-IN / ROOM BOOKING
====================================================== */
export async function POST(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            roomNumber,
            roomId,
            customerName,
            customerPhone,
            customerEmail,
            gender,
            idProofType,
            idProofNumber,
            customerAddress,
            city,
            entryTime,
            exitTime,
            adults,
            children,
            pricePerNight,
            totalAmount,
            advancePaid,
            paymentMode,
            remarks
        } = body;

        if (!roomNumber || !customerName || !customerPhone) {
            return NextResponse.json({ error: "Room number, customer name and phone are required" }, { status: 400 });
        }

        const roomRate = parseFloat(pricePerNight) || 1500;
        const advance = parseFloat(advancePaid) || 0;
        const total = parseFloat(totalAmount) || roomRate;
        const due = Math.max(0, total - advance);

        // 1. Create Booking Record
        const booking = await (prisma as any).hotelBooking.create({
            data: {
                clerkUserId: effectiveId,
                roomNumber: String(roomNumber).trim(),
                roomId: roomId || null,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                customerEmail: customerEmail || null,
                gender: gender || "Male",
                idProofType: idProofType || "Aadhaar Card",
                idProofNumber: idProofNumber || null,
                customerAddress: customerAddress || null,
                city: city || null,
                entryTime: entryTime ? new Date(entryTime) : new Date(),
                exitTime: exitTime ? new Date(exitTime) : null,
                adults: parseInt(adults) || 1,
                children: parseInt(children) || 0,
                pricePerNight: roomRate,
                totalAmount: total,
                advancePaid: advance,
                balanceDue: due,
                paymentMode: paymentMode || "Cash",
                status: "CHECKED_IN",
                remarks: remarks || null
            }
        });

        // 2. Update Room Status to OCCUPIED
        await (prisma as any).hotelRoom.updateMany({
            where: { clerkUserId: effectiveId, roomNumber: String(roomNumber).trim() },
            data: { status: "OCCUPIED" }
        });

        // 3. Upsert Party / Customer record for CRM
        try {
            const cleanPhone = customerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
            await (prisma as any).party.upsert({
                where: {
                    phone_createdBy: {
                        phone: cleanPhone,
                        createdBy: effectiveId
                    }
                },
                update: {
                    name: customerName,
                    address: customerAddress || undefined
                },
                create: {
                    phone: cleanPhone,
                    name: customerName,
                    createdBy: effectiveId,
                    address: customerAddress || undefined
                }
            });
        } catch (e) {
            console.warn("Party upsert skip during check-in");
        }

        return NextResponse.json(booking, { status: 201 });
    } catch (error: any) {
        console.error("CREATE_BOOKING_ERROR:", error);
        return NextResponse.json({ error: error.message || "Failed to check-in" }, { status: 500 });
    }
}

/* ======================================================
   PUT: CHECK-OUT ROOM / UPDATE BOOKING
====================================================== */
export async function PUT(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, action, actualCheckOutTime, totalAmount, advancePaid, balanceDue, paymentMode, remarks } = body;

        if (!id) return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });

        const existing = await (prisma as any).hotelBooking.findUnique({ where: { id } });
        if (!existing || existing.clerkUserId !== effectiveId) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (action === "CHECK_OUT") {
            const updated = await (prisma as any).hotelBooking.update({
                where: { id },
                data: {
                    status: "CHECKED_OUT",
                    actualCheckOutTime: actualCheckOutTime ? new Date(actualCheckOutTime) : new Date(),
                    totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : existing.totalAmount,
                    advancePaid: advancePaid !== undefined ? parseFloat(advancePaid) : existing.advancePaid,
                    balanceDue: balanceDue !== undefined ? parseFloat(balanceDue) : 0,
                    paymentMode: paymentMode || existing.paymentMode,
                    remarks: remarks || existing.remarks
                }
            });

            // Set room status back to CLEANING or AVAILABLE
            await (prisma as any).hotelRoom.updateMany({
                where: { clerkUserId: effectiveId, roomNumber: existing.roomNumber },
                data: { status: "CLEANING" }
            });

            return NextResponse.json(updated);
        }

        // Generic update
        const updated = await (prisma as any).hotelBooking.update({
            where: { id },
            data: {
                ...(totalAmount !== undefined ? { totalAmount: parseFloat(totalAmount) } : {}),
                ...(advancePaid !== undefined ? { advancePaid: parseFloat(advancePaid) } : {}),
                ...(balanceDue !== undefined ? { balanceDue: parseFloat(balanceDue) } : {}),
                ...(paymentMode ? { paymentMode } : {}),
                ...(remarks ? { remarks } : {})
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("UPDATE_BOOKING_ERROR:", error);
        return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }
}
