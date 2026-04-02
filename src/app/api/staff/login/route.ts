import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Staff Login
// Route: /api/staff/login
export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ 
                success: false, 
                message: "Email and password are required" 
            }, { status: 400 });
        }

        // Find staff by email
        const staff = await prisma.staff.findUnique({
            where: { email },
        });

        if (!staff) {
            return NextResponse.json({ 
                success: false, 
                message: "Staff member not found" 
            }, { status: 404 });
        }

        // Check password (matching plain text for now as per user pattern, but usually hashed)
        if (staff.password !== password) {
            return NextResponse.json({ 
                success: false, 
                message: "Invalid credentials" 
            }, { status: 401 });
        }

        if (staff.status === "inactive") {
            return NextResponse.json({ 
                success: false, 
                message: "Your account is inactive. Please contact your manager." 
            }, { status: 403 });
        }

        // Return staff details (including businessId for scoped data fetching)
        return NextResponse.json({
            success: true,
            message: "Login successful!",
            data: {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                accessType: staff.accessType,
                permissions: staff.permissions,
                businessId: staff.businessId
            }
        });

    } catch (err: any) {
        console.error("STAFF_LOGIN_ERROR:", err);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error" 
        }, { status: 500 });
    }
}
