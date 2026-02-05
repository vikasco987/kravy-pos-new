import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const bill = await prisma.billManager.update({
      where: { id },
      data: {
        isHeld: body.isHeld === true,
        paymentStatus: body.isHeld ? "HELD" : "Pending",
      },
    });

    return NextResponse.json({ bill }); 
  } catch (err) {
    console.error("HOLD BILL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update bill" },
      { status: 500 }
    );
  }
}
