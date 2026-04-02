import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Add a new staff member
// Route: /api/staff
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, accessType, permissions, businessId, phone } = body;

        // 1. Basic Validation
        if (!email || !password) {
            return NextResponse.json({ 
                success: false, 
                message: "Email and Password are required" 
            }, { status: 400 });
        }

        if (!businessId) {
            return NextResponse.json({ 
                success: false, 
                message: "Business ID is required" 
            }, { status: 400 });
        }

        // 2. Duplicate Check
        const existing = await prisma.staff.findUnique({
            where: { email }
        });

        if (existing) {
            return NextResponse.json({ 
                success: false, 
                message: "This email is already registered" 
            }, { status: 409 });
        }

        // 3. Save Data
        const staff = await prisma.staff.create({
            data: {
                name: name || "Staff Member",
                phone,
                email,
                password,
                accessType: accessType || "Sales Access",
                permissions: permissions || [],
                businessId: businessId,
                status: "active"
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Staff data saved successfully!", 
            data: staff 
        }, { status: 201 });

    } catch (err: any) {
        console.error("STAFF_POST_ERROR:", err);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error: " + err.message 
        }, { status: 500 });
    }
}

// GET: List all staff for a specific business
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get('businessId');

        if (!businessId) {
            return NextResponse.json({ 
                success: false, 
                message: "Business ID is required" 
            }, { status: 400 });
        }

        const data = await prisma.staff.findMany({
            where: { businessId },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ 
            success: true, 
            count: data.length, 
            data 
        });

    } catch (err: any) {
        console.error("STAFF_GET_ERROR:", err);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error: " + err.message 
        }, { status: 500 });
    }
}
// PUT: Update an existing staff member
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, phone, email, password, accessType, permissions } = body;

        if (!id) {
            return NextResponse.json({ 
                success: false, 
                message: "Staff ID is required for update" 
            }, { status: 400 });
        }

        const updatedStaff = await prisma.staff.update({
            where: { id: id },
            data: {
                name,
                phone,
                email,
                password,
                accessType,
                permissions,
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Staff updated successfully!", 
            data: updatedStaff 
        }, { status: 200 });

    } catch (err: any) {
        console.error("STAFF_PUT_ERROR:", err);
        return NextResponse.json({ 
            success: false, 
            message: "Update failed: " + err.message 
        }, { status: 500 });
    }
}
