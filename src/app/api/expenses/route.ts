import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const category = searchParams.get("category");

  try {
    const where: any = { userId: clerkId };
    
    if (category && category !== "All") {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET Expenses Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const { amount, category, description, date, paymentMode } = body;

    if (!amount || !category) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        userId: clerkId,
        amount: parseFloat(amount),
        category,
        description,
        date: date ? new Date(date) : new Date(),
        paymentMode,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("POST Expense Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
