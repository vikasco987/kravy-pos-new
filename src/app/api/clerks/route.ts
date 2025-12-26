import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      // 🔴 IMPORTANT: NO take, NO skip
      select: {
        clerkId: true,
        email: true,
        name: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    const clerks = users
      .filter((u) => u.clerkId) // safety
      .map((u) => ({
        clerkId: u.clerkId,
        label: u.name?.trim() || u.email,
        email: u.email,
      }));

    return NextResponse.json(clerks);
  } catch (error) {
    console.error("CLERKS FETCH ERROR:", error);
    return NextResponse.json([], { status: 200 });
  }
}
