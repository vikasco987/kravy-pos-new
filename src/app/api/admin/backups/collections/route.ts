
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

const uri = process.env.DATABASE_URL;

export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!uri) return NextResponse.json({ error: "DB URI missing" }, { status: 500 });

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    
    const collectionsRaw = await db.listCollections().toArray();
    
    const collectionsWithCounts = await Promise.all(
      collectionsRaw
        .filter(c => !c.name.startsWith('system.'))
        .map(async (c) => {
          const count = await db.collection(c.name).countDocuments();
          return { name: c.name, count: count };
        })
    );
    
    await client.close();
    collectionsWithCounts.sort((a, b) => b.count - a.count); // Show biggest tables first
    return NextResponse.json(collectionsWithCounts);
  } catch (error) {
    console.error("Collections Explorer Error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
