import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { targetUserId, slug, action } = await req.json();

    if (action === "REFRESH_PUBLIC_ID") {
      const updated = await prisma.businessProfile.update({
        where: { userId: targetUserId },
        data: { publicId: crypto.randomUUID() }
      });
      return NextResponse.json(updated);
    }

    if (action === "UPDATE_SLUG") {
      // Basic slug validation
      if (slug && !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ error: "Invalid slug format. Use lowercase, numbers and hyphens only." }, { status: 400 });
      }

      const updated = await prisma.businessProfile.update({
        where: { userId: targetUserId },
        data: { slug: slug || null }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "This slug is already taken by another POS." }, { status: 409 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
