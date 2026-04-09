import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const checkPermission = (user: any) => {
    // Only if user exists
    if (!user) return false;
    // Owners (ADMIN/SELLER/OWNER) have full access
    if (user.type === "ADMIN" || user.type === "SELLER" || user.type === "OWNER") return true;
    // Staff must have the explicit permission path
    if (user.type === "STAFF" && user.permissions.includes("/dashboard/staff")) return true;
    return false;
};

// GET: List all staff for the logged-in business
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkPermission(user)) {
        return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const businessId = user.businessId;

    // 1. Fetch staff from User model (Legacy/Clerk users)
    const clerkStaff = await prisma.user.findMany({
      where: { ownerId: businessId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clerkId: true,
        allowedPaths: true,
        isDisabled: true,
        createdAt: true,
      }
    });

    // 2. Fetch staff from Staff model (New/Prisma-only users)
    const prismaStaffRaw = await prisma.staff.findMany({
      where: { businessId: businessId },
    });

    // Map PrismaStaff to match User structure for UI compatibility
    const prismaStaff = prismaStaffRaw.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.accessType, // Using accessType as role
      clerkId: null, // No clerkId for these
      allowedPaths: s.permissions,
      isDisabled: s.status !== "active",
      createdAt: s.createdAt,
      source: "prisma"
    }));

    return NextResponse.json([...clerkStaff, ...prismaStaff]);
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// POST: Create a new staff member
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkPermission(user)) {
        return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const { name, email, password, phone, accessType, permissions } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingInUser = await prisma.user.findUnique({ where: { email } });
    const existingInStaff = await prisma.staff.findUnique({ where: { email } });
    
    if (existingInUser || existingInStaff) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Manual check for phone uniqueness within the same business
    if (phone) {
        const existingPhone = await prisma.staff.findFirst({ where: { phone, businessId: user.businessId } });
        if (existingPhone) {
            return NextResponse.json({ error: "Phone number already exists in your staff list" }, { status: 400 });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.staff.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        accessType: accessType || "Sales Access",
        permissions: permissions || ["/dashboard"],
        businessId: user.businessId,
        status: "active"
      }
    });

    return NextResponse.json(newStaff);
  } catch (error: any) {
    console.error("CREATE STAFF ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to create staff" }, { status: 500 });
  }
}

// PUT: Update staff permissions
export async function PUT(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkPermission(user)) {
        return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const body = await req.json();
    const { 
        id, 
        staffId, 
        clerkId, 
        staffClerkId, 
        allowedPaths, 
        isDisabled, 
        newPassword, 
        name, 
        phone, 
        accessType 
    } = body;

    const targetStaffId = staffId || id;
    const targetClerkId = clerkId || staffClerkId;
    const businessId = user.businessId;

    // 1. If it's a Clerk User (Legacy)
    if (targetClerkId) {
        const staffUser = await prisma.user.findFirst({ where: { clerkId: targetClerkId } });
        if (staffUser && staffUser.ownerId === businessId) {
            const updated = await prisma.user.update({
                where: { clerkId: targetClerkId },
                data: {
                    allowedPaths: allowedPaths !== undefined ? allowedPaths : undefined,
                    isDisabled: isDisabled !== undefined ? isDisabled : undefined,
                }
            });
            return NextResponse.json(updated);
        }
    }

    // 2. If it's a Prisma-only Staff
    if (targetStaffId) {
        const staffPrisma = await prisma.staff.findFirst({ where: { id: targetStaffId } });
        if (staffPrisma && staffPrisma.businessId === businessId) {
            
            let updateData: any = {
                name: name || undefined,
                phone: phone || undefined,
                accessType: accessType || undefined,
                permissions: allowedPaths || undefined,
                status: isDisabled !== undefined ? (isDisabled ? "inactive" : "active") : undefined,
            };

            if (newPassword) {
                updateData.password = await bcrypt.hash(newPassword, 10);
            }

            const updated = await prisma.staff.update({
                where: { id: targetStaffId },
                data: updateData
            });
            return NextResponse.json(updated);
        }
    }

    return NextResponse.json({ error: "Staff not found or access denied" }, { status: 404 });
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

// DELETE: Remove a staff member
export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkPermission(user)) {
        return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("id");
    const clerkId = searchParams.get("clerkId");
    const businessId = user.businessId;

    if (!staffId && !clerkId) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
    }

    // 1. If it's a Clerk User (Legacy)
    if (clerkId) {
      const staffUser = await prisma.user.findFirst({ where: { clerkId } });
      if (staffUser && staffUser.ownerId === businessId) {
        await prisma.user.delete({ where: { clerkId } });
        return NextResponse.json({ success: true, message: "Staff member deleted" });
      }
    }

    // 2. If it's a Prisma-only Staff
    if (staffId) {
      const staffPrisma = await prisma.staff.findFirst({ where: { id: staffId } });
      if (staffPrisma && staffPrisma.businessId === businessId) {
        await prisma.staff.delete({ where: { id: staffId } });
        return NextResponse.json({ success: true, message: "Staff member deleted" });
      }
    }

    return NextResponse.json({ error: "Staff not found or access denied" }, { status: 404 });
  } catch (error) {
    console.error("DELETE STAFF ERROR:", error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
