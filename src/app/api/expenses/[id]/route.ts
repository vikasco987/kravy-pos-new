import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const { amount, category, description, date, paymentMode } = body;

    const expense = await prisma.expense.update({
      where: { id: params.id, userId: clerkId },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        category,
        description,
        date: date ? new Date(date) : undefined,
        paymentMode,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("PATCH Expense Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    await prisma.expense.delete({
      where: { id: params.id, userId: clerkId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE Expense Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
