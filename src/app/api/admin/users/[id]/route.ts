import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser();
    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if it's a Staff model user
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        business: true
      }
    });

    if (staff) {
      return NextResponse.json({
        ...staff,
        isStaffModel: true,
        source: "prisma"
      });
    }

    // Check if it's a User model user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (user) {
      return NextResponse.json({
        ...user,
        isStaffModel: false,
        source: "clerk"
      });
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error("ADMIN GET USER DETAIL ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    // We already have a PUT in the main route, but we can move it here or keep it there.
    // For now, let's just use the main PUT to keep it simple, or implement specific ones here.
    return NextResponse.json({ error: "Use main users API for updates" }, { status: 405 });
}
