import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

/* =========================
   GET → LIST USERS
========================= */
export async function GET(req: Request) {
  try {
    const me = await getAuthUser();

    if (!me) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (me.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 1. Fetch from User model
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        role: true,
        isDisabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch from Staff model
    const staff = await prisma.staff.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            accessType: true,
            status: true,
            createdAt: true,
            businessId: true,
        }
    });

    // Map Staff to match User structure for UI
    const mappedStaff = staff.map(s => ({
        id: s.id,
        clerkId: `staff_${s.id}`, // Pseudo clerkId for UI keys
        name: s.name,
        email: s.email,
        role: "USER" as const, // Treat as USER role in the main list
        isDisabled: s.status !== "active",
        createdAt: s.createdAt,
        isStaffModel: true, // Tag for potential specific actions
        businessId: s.businessId
    }));

    // Combine both
    const allUsers = [...users, ...mappedStaff].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allUsers, { status: 200 });
  } catch (error) {
    console.error("ADMIN GET USERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/* =========================
   POST → CREATE USER
========================= */
export async function POST(req: Request) {
  try {
    const admin = await getAuthUser();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    let { name, email, password, role, isDisabled } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔒 Ensure strong password (minimum safety)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // 🧼 Clean name safely
    const parts = name.trim().split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "User";

    // 🚫 Prevent duplicate email in DB
    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

   // Get Clerk client (do this once at top of handler)
    const client = await clerkClient();

// ✅ Create user in Clerk
    const clerkUserDetails = {
      emailAddress: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      publicMetadata: {
        role: role,
      },
    };

    console.log("Attempting to create Clerk user:", clerkUserDetails);

    const clerkUser = await client.users.createUser(clerkUserDetails);


    // ✅ Store in DB
    const user = await prisma.user.create({
      data: {
        name,
        email,
        clerkId: clerkUser.id,
        role,
        isDisabled: Boolean(isDisabled),
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("ADMIN CREATE USER ERROR:", error);

    // 🔍 Clerk specific error handling
    if (error?.clerkError) {
      return NextResponse.json(
        {
          error:
            error.errors?.[0]?.longMessage ||
            "Invalid data sent to Clerk",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "User creation failed" },
      { status: 500 }
    );
  }
}
