import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

   // Get Clerk client
    const client = await clerkClient();

    // 🔹 Get full Clerk user to read metadata
    const clerkUser = await client.users.getUser(userId);

    const rawRole =
      clerkUser.publicMetadata?.role ||
      clerkUser.privateMetadata?.role ||
      "USER";

// 🔹 normalize role to Prisma enum
const roleFromClerk =
  String(rawRole).toUpperCase() === "ADMIN"
    ? "ADMIN"
    : String(rawRole).toUpperCase() === "SELLER"
    ? "SELLER"
    : "USER";

    const body = await req.json();
    const { name, email } = body;

    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name,
        email,
        role: roleFromClerk, // 🔥 ROLE SYNCED HERE
      },
      create: {
        clerkId: userId,
        name,
        email,
        role: roleFromClerk,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("USER SYNC ERROR:", error);
    return NextResponse.json(
      { error: "User sync failed" },
      { status: 500 }
    );
  }
}
