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

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 1. Try Staff Model
    try {
      const staff = await prisma.staff.findUnique({
        where: { id }
      });
      if (staff) {
        return NextResponse.json({
          ...staff,
          isStaffModel: true,
          loginType: "STAFF",
          source: "prisma"
        });
      }
    } catch (e) {}

    // 2. Try User Model
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      if (user) {
        return NextResponse.json({
          ...user,
          isStaffModel: false,
          loginType: user.clerkId?.startsWith("custom_") ? "CUSTOM" : "CLERK",
          source: "clerk"
        });
      }
    } catch (e) {}

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error: any) {
    console.error("ADMIN GET USER DETAIL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ error: "Use main users API" }, { status: 405 });
}
