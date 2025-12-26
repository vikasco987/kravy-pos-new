import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔹 Get full Clerk user to read metadata
    const clerkUser = await clerkClient.users.getUser(userId);

    const roleFromClerk =
      (clerkUser.publicMetadata?.role as string) || "USER";

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
