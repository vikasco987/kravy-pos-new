import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const categories = await prisma.expenseCategory.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("GET Categories Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { name, color, icon } = body;

        if (!name) return new NextResponse("Name is required", { status: 400 });

        const category = await prisma.expenseCategory.create({
            data: {
                userId,
                name,
                color: color || "#64748B",
                icon: icon || "MoreHorizontal",
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("POST Category Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
