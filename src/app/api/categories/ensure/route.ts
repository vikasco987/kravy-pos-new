import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name } = await req.json();

  let category = await prisma.category.findFirst({
    where: { name },
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name },
    });
  }

  return NextResponse.json(category);
}
