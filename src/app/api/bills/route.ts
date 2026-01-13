import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // ---------- AUTH ----------
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ---------- FIND USER ----------
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ---------- FETCH BILLS ----------
    const bills = await prisma.bill.findMany({
      where: {
        userId: dbUser.id,
      },
      include: {
        customer: true,
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // ---------- NORMALIZE ID ----------
    const safeBills = bills.map((b) => ({
      ...b,
      id: b.id.toString(),
    }));

    return NextResponse.json(safeBills, { status: 200 });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { message: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}
