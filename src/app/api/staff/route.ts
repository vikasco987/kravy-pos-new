import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Add a new staff member
// Route: /api/staff
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, phone, accessType, permissions, businessId } = body;

        // 1. Basic Validation
        if (!phone || phone.length < 10) {
            return NextResponse.json({ 
                success: false, 
                message: "Valid 10-digit phone number is required" 
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
            where: { phone }
        });

        if (existing) {
            return NextResponse.json({ 
                success: false, 
                message: "This phone number is already registered" 
            }, { status: 409 });
        }

        // 3. Save Data
        const staff = await prisma.staff.create({
            data: {
                name: name || "Staff Member",
                phone,
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
