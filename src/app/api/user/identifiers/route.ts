import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
    try {
        const auth = await getAuthUser();
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: auth.id },
            select: {
                secondaryEmails: true,
                secondaryPhones: true,
                email: true,
                phone: true
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = await getAuthUser();
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { type, value } = await req.json();

        if (!value) return NextResponse.json({ error: "Value is required" }, { status: 400 });

        const user = await prisma.user.findUnique({
            where: { id: auth.id }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const updateData: any = {};
        if (type === "email") {
            const emails = user.secondaryEmails || [];
            if (emails.includes(value) || user.email === value) {
                return NextResponse.json({ error: "Email already exists" }, { status: 400 });
            }
            updateData.secondaryEmails = [...emails, value];
        } else if (type === "phone") {
            const phones = user.secondaryPhones || [];
            if (phones.includes(value) || user.phone === value) {
                return NextResponse.json({ error: "Phone already exists" }, { status: 400 });
            }
            updateData.secondaryPhones = [...phones, value];
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: auth.id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const auth = await getAuthUser();
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { type, value } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: auth.id }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const updateData: any = {};
        if (type === "email") {
            updateData.secondaryEmails = (user.secondaryEmails || []).filter(e => e !== value);
        } else if (type === "phone") {
            updateData.secondaryPhones = (user.secondaryPhones || []).filter(p => p !== value);
        }

        const updated = await prisma.user.update({
            where: { id: auth.id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
