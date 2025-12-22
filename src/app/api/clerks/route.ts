import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  // Minimal clerk object
  return NextResponse.json([
    {
      id: userId,
      name: "Uploader",
    },
  ]);
}

