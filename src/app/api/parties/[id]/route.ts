// src/app/api/parties/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PUT(req: NextRequest, context: any) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // `params` can be a Promise in this environment — await it
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json();
    const { name, phone, address, dob } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const existing = await prisma.party.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.createdBy !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.party.update({
      where: { id },
      data: { name, phone, address, dob: dob ? new Date(dob) : null },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error updating party:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existing = await prisma.party.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.createdBy !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.party.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error deleting party (id):", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
