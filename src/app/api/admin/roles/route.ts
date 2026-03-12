import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });
    
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const permissions = await (prisma as any).rolePermission.findMany();
    return NextResponse.json(permissions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch role permissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });
    
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { role, allowedPaths } = await req.json();

    if (!role || !allowedPaths) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await (prisma as any).rolePermission.upsert({
       where: { role: role as Role },
       update: { allowedPaths },
       create: { role: role as Role, allowedPaths }
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
