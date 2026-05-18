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

    // 1. Fetch from User model (Clerk + Custom OTP Users)
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

    const mappedUsers = users.map(u => ({
        ...u,
        isStaffModel: false,
        loginType: u.clerkId.startsWith("custom_") ? "CUSTOM" : "CLERK"
    }));

    // 2. Fetch from Staff model (Local Staff)
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
        role: "STAFF" as any, 
        isDisabled: s.status !== "active",
        createdAt: s.createdAt,
        isStaffModel: true,
        loginType: "STAFF",
        businessId: s.businessId
    }));

    // Combine both
    const allUsers = [...mappedUsers, ...mappedStaff].sort((a, b) => 
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
/* =========================
   PUT → UPDATE USER
========================= */
export async function PUT(req: Request) {
  try {
    const admin = await getAuthUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, name, password, isStaffModel } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // 1. Handle Staff Model Users
    if (isStaffModel) {
      let updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.isDisabled !== undefined) updateData.status = body.isDisabled ? 'suspended' : 'active';
      if (body.privateMetadata !== undefined) updateData.privateMetadata = body.privateMetadata;
      if (password) {
        const bcrypt = await import("bcryptjs");
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updated = await prisma.staff.update({
        where: { id: userId },
        data: updateData
      });
      return NextResponse.json(updated);
    }

    // 2. Handle Clerk Users
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { publicMetadata, privateMetadata, unsafeMetadata } = body;

    const client = await clerkClient();
    let clerkUpdate: any = {};
    if (name) {
      const parts = name.trim().split(" ");
      clerkUpdate.firstName = parts[0];
      clerkUpdate.lastName = parts.slice(1).join(" ") || "User";
    }

    // Update Clerk metadata if applicable
    if (publicMetadata) clerkUpdate.publicMetadata = publicMetadata;
    if (privateMetadata) clerkUpdate.privateMetadata = privateMetadata;
    if (unsafeMetadata) clerkUpdate.unsafeMetadata = unsafeMetadata;

    if (user.clerkId && !user.clerkId.startsWith("custom_")) {
      try {
        await client.users.updateUser(user.clerkId, clerkUpdate);
        
        // Handle Clerk Session Revocation
        if (body.revokeSessions) {
          try {
            const sessions = await client.sessions.getSessionList({ userId: user.clerkId });
            for (const session of sessions.data) {
              await client.sessions.revokeSession(session.id);
            }
          } catch (error) {
            console.error("Error revoking clerk sessions:", error);
          }
        }
      } catch (clerkError: any) {
        if (clerkError.status === 404) {
           console.warn(`Clerk user ${user.clerkId} not found. Proceeding with local DB update only.`);
        } else {
           console.error("Clerk updateUser error:", clerkError);
        }
      }
    }

    // Handle Local Session Revocation
    if (body.revokeSessions) {
      try {
        await prisma.userSession.deleteMany({
          where: { userId: user.id }
        });
      } catch (error) {
        console.error("Error revoking local sessions:", error);
      }
    }

    let dbUpdate: any = { 
      name: name || undefined,
      secondaryEmails: body.secondaryEmails !== undefined ? body.secondaryEmails : undefined,
      secondaryPhones: body.secondaryPhones !== undefined ? body.secondaryPhones : undefined,
      publicMetadata: publicMetadata !== undefined ? publicMetadata : undefined,
      privateMetadata: privateMetadata !== undefined ? privateMetadata : undefined,
      unsafeMetadata: unsafeMetadata !== undefined ? unsafeMetadata : undefined,
      role: body.role !== undefined ? body.role : undefined,
      isDisabled: body.isDisabled !== undefined ? body.isDisabled : undefined,
    };
    if (password && user.clerkId?.startsWith("custom_")) {
      const bcrypt = await import("bcryptjs");
      dbUpdate.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dbUpdate
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("ADMIN UPDATE USER ERROR:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}
