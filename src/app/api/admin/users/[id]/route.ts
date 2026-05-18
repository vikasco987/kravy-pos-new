import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser();
    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 1. Try Staff Model
    const staff = await prisma.staff.findUnique({
      where: { id }
    });

    if (staff) {
      let sessions: any[] = [];
      try {
        // Fetch local sessions for staff
        const localSessions = await prisma.userSession.findMany({
          where: { staffId: id },
          orderBy: { createdAt: 'desc' },
          take: 5
        });
        sessions = localSessions.map(s => ({
          id: s.id,
          status: 'active',
          lastActiveAt: s.lastActive,
          browserName: s.browser,
          osName: s.os,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          isLocal: true
        }));
      } catch (err) {
        console.error("Error fetching staff sessions:", err);
      }

      return NextResponse.json({
        ...staff,
        isStaffModel: true,
        loginType: "STAFF",
        source: "prisma",
        sessions
      });
    }

    // 2. Try User Model
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (user) {
      let sessions: any[] = [];
      
      // Fetch sessions and metadata from Clerk if it's a Clerk user
      if (user.clerkId && !user.clerkId.startsWith("custom_")) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(user.clerkId);
          
          // Merge metadata from Clerk
          user.publicMetadata = clerkUser.publicMetadata;
          user.privateMetadata = clerkUser.privateMetadata;
          user.unsafeMetadata = clerkUser.unsafeMetadata;

          const sessionList = await client.sessions.getSessionList({
            userId: user.clerkId
          });
          sessions = sessionList.data.map(s => ({
            id: s.id,
            status: s.status,
            lastActiveAt: s.lastActiveAt,
            expireAt: s.expireAt,
            browserName: s.browserName,
            browserVersion: s.browserVersion,
            deviceType: s.deviceType,
            osName: s.osName,
            osVersion: s.osVersion,
            ipAddress: s.ipAddress,
          }));
        } catch (sessionErr) {
          console.error("Failed to fetch Clerk data:", sessionErr);
        }
      }

      try {
        // Fetch local sessions from Prisma
        const localSessions = await prisma.userSession.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        const formattedLocal = localSessions.map(s => ({
          id: s.id,
          status: 'active',
          lastActiveAt: s.lastActive,
          browserName: s.browser,
          osName: s.os,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          isLocal: true
        }));
        
        sessions = [...sessions, ...formattedLocal];
      } catch (err) {
        console.error("Error fetching local sessions:", err);
      }

      return NextResponse.json({
        ...user,
        isStaffModel: false,
        loginType: user.clerkId?.startsWith("custom_") ? "CUSTOM" : "CLERK",
        source: "clerk",
        sessions
      });
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error: any) {
    console.error("ADMIN GET USER DETAIL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ error: "Use main users API" }, { status: 405 });
}
