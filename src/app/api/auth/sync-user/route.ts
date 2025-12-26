import { NextResponse } from "next/server";
import { getAuth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress || "";
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

    // 🔍 Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existing) {
      return NextResponse.json({ ok: true });
    }

    // ✅ Create DB user
    await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("USER SYNC ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
