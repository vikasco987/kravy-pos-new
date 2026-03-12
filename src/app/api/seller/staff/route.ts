import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";


export const runtime = "nodejs";

// GET: List all staff for the logged-in Seller
export async function GET() {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
    });

    if (!seller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await prisma.user.findMany({
      where: { ownerId: effectiveId },
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

    return NextResponse.json(staff);
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// POST: Create a new staff member
export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
    });

    if (!seller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists in DB
    const existingInDb = await prisma.user.findUnique({ where: { email } });
    if (existingInDb) {
      return NextResponse.json({ error: "User with this email already exists in Database" }, { status: 400 });
    }

    // 1. Create user in Clerk
    const client = await clerkClient();
    
    let clerkUser;
    try {
      clerkUser = await client.users.createUser({
        emailAddress: [email],
        password,
        firstName: name,
        skipPasswordChecks: true,
        publicMetadata: { role: "USER", ownerId: effectiveId }
      });
    } catch (clerkErr: any) {
      console.error("CLERK CREATE ERROR:", clerkErr);
      const message = clerkErr.errors?.[0]?.longMessage || clerkErr.message || "Failed to create user in Clerk";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // 2. Create user in Prisma
    try {
      const newUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          name,
          role: "USER",
          ownerId: effectiveId,
          allowedPaths: ["/dashboard"], // default
        }
      });
      return NextResponse.json(newUser);
    } catch (prismaErr: any) {
      console.error("PRISMA CREATE ERROR:", prismaErr);
      // If Prisma fails, we might want to delete the Clerk user to keep them in sync
      try {
        await client.users.deleteUser(clerkUser.id);
      } catch (delErr) {
        console.error("FAILED TO ROLLBACK CLERK USER:", delErr);
      }
      return NextResponse.json({ error: "Failed to create user in Database: " + prismaErr.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("CREATE STAFF ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to create staff" }, { status: 500 });
  }
}

// PUT: Update staff permissions
export async function PUT(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { staffClerkId, allowedPaths, isDisabled, newPassword } = await req.json();

    // Verify this staff belongs to this seller by fetching and checking ownerId
    const staff = await prisma.user.findFirst({
      where: { clerkId: staffClerkId }
    });

    if (!staff || (staff as any).ownerId !== effectiveId) {
        return NextResponse.json({ error: "Staff user not found or not owned by you" }, { status: 404 });
    }

    // 1. If password update requested, update in Clerk
    if (newPassword) {
      const client = await clerkClient();
      await client.users.updateUser(staffClerkId, {
        password: newPassword,
        skipPasswordChecks: true,
      });
    }

    // 2. Update metadata in Prisma
    const updated = await prisma.user.update({
      where: { clerkId: staffClerkId },
      data: {
        allowedPaths: allowedPaths !== undefined ? allowedPaths : undefined,
        isDisabled: isDisabled !== undefined ? isDisabled : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}
