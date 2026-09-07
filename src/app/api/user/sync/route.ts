import { getEffectiveClerkId } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = await getEffectiveClerkId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email } = body;

    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                clerkId: userId,
                name: name || "",
                email: email || "",
                role: "SELLER"
            }
        });
    }


    return NextResponse.json(user);
  } catch (error) {
    console.error("USER SYNC ERROR:", error);
    return NextResponse.json(
      { error: "User sync failed" },
      { status: 500 }
    );
  }
}
