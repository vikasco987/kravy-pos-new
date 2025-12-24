import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all clerks (users) from DB
    const clerks = await prisma.user.findMany({
      select: {
        clerkId: true,
        email: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    // Always return array (safe for frontend)
    return NextResponse.json(clerks);
  } catch (error) {
    console.error("CLERKS FETCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch clerks" },
      { status: 500 }
    );
  }
}
