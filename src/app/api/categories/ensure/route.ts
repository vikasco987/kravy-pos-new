import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let category = await prisma.category.findFirst({
      where: { 
        name: { equals: name.trim(), mode: "insensitive" },
        clerkId: effectiveId 
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { 
          name: name.trim(),
          clerkId: effectiveId
        },
      });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("CATEGORY ENSURE ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
