import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { request } from "https";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // ✅ SAFE email extraction
    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email not found in Clerk" },
        { status: 400 }
      );
    }

    // ✅ SAFE name
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      "User";

    // 🔍 Check by clerkId FIRST
    const existing = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existing) {
      return NextResponse.json({ ok: true });
    }

    // 🔍 Check duplicate email (important)
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      return NextResponse.json(
        { ok: true, warning: "Email already exists in DB" }
      );
    }

    // ✅ Create DB user with defaults
    await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        role: "SELLER",        // ✅ default role is now SELLER
        isDisabled: false,   // ✅ explicit
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("USER SYNC ERROR:", error);
    return NextResponse.json(
      { ok: false },
      { status: 500 }
    );
  }
}
