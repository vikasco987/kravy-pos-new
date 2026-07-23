import { NextRequest, NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const invoice = await prisma.manualInvoice.update({
      where: { id: params.id, clerkUserId: effectiveId },
      data: {
        status: body.status,
      }
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("PATCH Manual Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.manualInvoice.delete({
      where: { id: params.id, clerkUserId: effectiveId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Manual Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
