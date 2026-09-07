import { getEffectiveClerkId } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getEffectiveClerkId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const updated = await prisma.user.update({
      where: { clerkId: userId },
      data: { role: "ADMIN" }
    });

    return NextResponse.json({ 
      success: true, 
      message: `User ${updated.name} promoted to ADMIN. Please refresh.`,
      user: updated
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
