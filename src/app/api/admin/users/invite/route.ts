export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 🔐 Auth (safe in App Router)
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 Admin check (DB is source of truth)
    const me = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role } = await req.json();

    if (!email || !["USER", "SELLER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // ✅ Correct Clerk backend client
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const invite = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
    });

    // 🧾 Audit log
    await prisma.activityLog.create({
      data: {
        userId: me.id,
        action: "USER_INVITED",
        meta: `Invited ${email} as ${role}`,
      },
    });

    return NextResponse.json({
      success: true,
      invitationId: invite.id,
    });
  } catch (error: any) {
    console.error("INVITE USER ERROR:", error);

    if (error?.status === 422) {
      return NextResponse.json(
        {
          error:
            "Invitation failed. Email may already exist or invitations are disabled in Clerk.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}
