import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { name, color, icon } = body;

        const category = await prisma.expenseCategory.update({
            where: { id: params.id, userId },
            data: { name, color, icon },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("PATCH Category Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        await prisma.expenseCategory.delete({
            where: { id: params.id, userId },
        });
        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("DELETE Category Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
