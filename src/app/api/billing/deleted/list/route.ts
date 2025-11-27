import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.deleteHistory.findMany({
      orderBy: { deletedAt: "desc" }, // FIXED
    });

    return NextResponse.json({ deleted });
  } catch (err) {
    console.error("FETCH DELETE HISTORY ERROR →", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
