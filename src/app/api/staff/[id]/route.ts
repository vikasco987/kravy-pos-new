import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT: Update a staff member
// Route: /api/staff/[id]
export async function PUT(
    req: NextRequest, 
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        
        const updated = await prisma.staff.update({
            where: { id: params.id },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });

        if (!updated) {
            return NextResponse.json({ 
                success: false, 
                message: "Staff member not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Staff member updated successfully", 
            data: updated 
        });

    } catch (err: any) {
        console.error("STAFF_PUT_ERROR:", err);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error: " + err.message 
        }, { status: 500 });
    }
}

// DELETE: Remove a staff member
export async function DELETE(
    req: NextRequest, 
    { params }: { params: { id: string } }
) {
    try {
        const deleted = await prisma.staff.delete({
            where: { id: params.id }
        });

        if (!deleted) {
            return NextResponse.json({ 
                success: false, 
                message: "Staff member not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Staff member deleted successfully" 
        });

    } catch (err: any) {
        console.error("STAFF_DELETE_ERROR:", err);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error: " + err.message 
        }, { status: 500 });
    }
}
