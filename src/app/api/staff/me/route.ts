import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const authUser = await getAuthUser();

        if (!authUser) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            data: authUser
        });

    } catch (error: any) {
        console.error("STAFF_ME_ERROR:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch staff info: " + error.message
        }, { status: 500 });
    }
}
