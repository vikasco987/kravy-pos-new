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

        // If it's a staff member from our custom Staff model
        if (authUser.type === 'STAFF') {
            const staff = await prisma.staff.findUnique({
                where: { id: authUser.id }
            });

            if (!staff) {
                return NextResponse.json({
                    success: false,
                    message: "Staff member not found"
                }, { status: 404 });
            }

            const { password, ...staffData } = staff;
            return NextResponse.json({
                success: true,
                data: staffData
            });
        }

        // If it's a Clerk user (Owner/Admin)
        const user = await prisma.user.findUnique({
            where: { id: authUser.id }
        });

        return NextResponse.json({
            success: true,
            data: user
        });

    } catch (error: any) {
        console.error("STAFF_ME_ERROR:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch staff info: " + error.message
        }, { status: 500 });
    }
}
