import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - List attendance for date range
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return new NextResponse("Not Found", { status: 404 });

    const ownerId = user.role === "ADMIN" || user.role === "SELLER" ? user.clerkId : user.ownerId;
    if (!ownerId) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // Optional filter by date "YYYY-MM-DD"

    const where: any = { ownerId };
    if (date) {
      where.date = date;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        staff: true,
      },
      orderBy: { checkIn: "desc" },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("ATTENDANCE GET ERR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST - Check In/Out (Staff) or Manual Edit (Admin)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return new NextResponse("Forbidden", { status: 403 });

    const data = await req.json();
    const { attendanceId, checkOutTime, action } = data;

    // 1. Manual Checkout by Admin/Master
    if (action !== "punch" && (user.role === "ADMIN" || user.role === "SELLER")) {
      if (!attendanceId || !checkOutTime) {
        return new NextResponse("Missing data", { status: 400 });
      }

      const att = await prisma.attendance.findUnique({ where: { id: attendanceId } });
      if (!att) return new NextResponse("Not Found", { status: 404 });

      const checkOutDate = new Date(checkOutTime);
      if (checkOutDate <= att.checkIn) {
        return new NextResponse("Check Out must be after Check In", { status: 400 });
      }

      const diffMs = checkOutDate.getTime() - att.checkIn.getTime();
      const workingMins = Math.floor(diffMs / 60000);

      const updated = await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          checkOut: checkOutDate,
          workingMins,
        },
        include: { staff: true },
      });

      return NextResponse.json(updated);
    }

    // 2. Staff Punch In/Out Self Service
    if (action === "punch") {
      // Force IST timezone for the "date" string
      const now = new Date();
      const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }); 
      const istDate = new Date(istString);
      const yyyy = istDate.getFullYear();
      const mm = String(istDate.getMonth() + 1).padStart(2, '0');
      const dd = String(istDate.getDate()).padStart(2, '0');
      const localDateStr = `${yyyy}-${mm}-${dd}`;
      const ownerId = user.ownerId || user.clerkId;

      // Find if already punched in today
      const existing = await prisma.attendance.findUnique({
        where: { staffId_date: { staffId: user.id, date: localDateStr } }
      });

      if (!existing) {
        // Punch IN
        const newAtt = await prisma.attendance.create({
          data: {
            staffId: user.id,
            ownerId,
            date: localDateStr,
            checkIn: new Date(), // Storing UTC in DB is fine, we just needed the date string for uniqueness
          }
        });
        return NextResponse.json({ message: "Punched In", record: newAtt });
      } else if (!existing.checkOut) {
        // Punch OUT
        const nowMs = new Date().getTime();
        const diffMs = nowMs - existing.checkIn.getTime();
        const workingMins = Math.floor(diffMs / 60000);

        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            checkOut: new Date(),
            workingMins
          }
        });
        return NextResponse.json({ message: "Punched Out", record: updated });
      } else {
        return new NextResponse("Already completed attendance for today", { status: 400 });
      }
    }

    return new NextResponse("Invalid action", { status: 400 });

  } catch (error) {
    console.error("ATTENDANCE POST ERR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

