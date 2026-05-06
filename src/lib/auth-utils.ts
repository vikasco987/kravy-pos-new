import { auth } from '@clerk/nextjs/server';
import prisma from './prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

/**
 * Returns the effective Clerk ID (the Owner's ID) for the current user.
 * Works for both Owners (direct Clerk user) and Staff.
 * Supports Admin Impersonation (View-As) via 'x-impersonate-id' header or search params.
 */
export async function getEffectiveClerkId(): Promise<string | null> {
  // 1. Get current logged-in user
  const { userId } = await auth();
  
  if (userId) {
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, ownerId: true }
    });

    // CRITICAL: If user is not in DB or has no ownerId, try to sync from Clerk metadata
    // This fixed the "History not showing" issue for Sellers/Staff logged in via Clerk
    if (!user || (!user.ownerId && user.role !== "ADMIN")) {
       try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          const fullUser = await client.users.getUser(userId);
          const ownerId = (fullUser.publicMetadata?.ownerId as string) || null;

          if (!user) {
            user = await prisma.user.create({
              data: {
                clerkId: userId,
                email: fullUser.emailAddresses[0].emailAddress,
                name: `${fullUser.firstName || ""} ${fullUser.lastName || ""}`.trim() || fullUser.username || "Staff Member",
                role: "USER",
                ownerId: ownerId,
              },
              select: { id: true, role: true, ownerId: true }
            });
          } else if (ownerId && !user.ownerId) {
            user = await prisma.user.update({
              where: { clerkId: userId },
              data: { ownerId: ownerId },
              select: { id: true, role: true, ownerId: true }
            });
          }
       } catch (err) {
          console.error("Auth sync error:", err);
       }
    }

    // Check for impersonation if user is ADMIN
    if (user && user.role === "ADMIN") {
      const headersList = await (await import('next/headers')).headers();
      const referer = headersList.get('referer') || 'http://localhost';
      const { searchParams } = new URL(referer);
      const impersonateId = searchParams.get('asUserId');
      if (impersonateId) {
        return impersonateId;
      }
    }

    return user?.ownerId || userId;
  }

  // 2. Try Custom JWT Auth (Legacy Staff OR New Custom User)
  const cookieStore = await cookies();
  const token = cookieStore.get('kravy_auth_token')?.value || cookieStore.get('staff_token')?.value;

  if (token) {
      try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          // For new custom auth, we use 'clerkId' or 'businessId'
          return decoded.clerkId || decoded.businessId || decoded.userId; 
      } catch (err) {
          return null;
      }
  }

  return null;
}

export type AuthUser = {
    id: string;
    type: 'ADMIN' | 'SELLER' | 'STAFF' | 'OWNER' | 'USER'; 
    businessId: string;
    permissions: string[];
    name?: string;
    email?: string;
    role?: string; 
}

/**
 * High-level auth check to determine who is making the request.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    // 1. Check Clerk (Owner or Clerk-linked Staff)
    const { userId: clerkUserId } = await auth();
    if (clerkUserId) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (user) {
            return {
                id: user.id,
                type: (user.ownerId ? 'STAFF' : (user.role as any)) || 'OWNER',
                businessId: user.ownerId || user.clerkId || "",
                permissions: user.allowedPaths, 
                name: user.name,
                email: user.email,
                role: user.role
            };
        }
    }

    // 2. Check Custom JWT (New Auth OR Legacy Staff)
    const cookieStore = await cookies();
    const token = cookieStore.get('kravy_auth_token')?.value || cookieStore.get('staff_token')?.value;

    if (token) {
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.userId || decoded.staffId;

            // 🔍 ALWAYS FETCH LATEST DATA FROM DB (Sync Fix)
            // This ensures role changes are reflected immediately without logout
            const user = await prisma.user.findUnique({ where: { id: userId } });
            
            if (user) {
                return {
                    id: user.id,
                    type: user.role, // Latest role from DB
                    businessId: user.ownerId || user.clerkId || "",
                    permissions: user.allowedPaths,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            }

            // Fallback for legacy staff model if not in User table
            return {
                id: userId,
                type: decoded.role || 'STAFF',
                businessId: decoded.clerkId || decoded.businessId || "",
                permissions: decoded.permissions || [],
                name: decoded.name,
                email: decoded.email,
                role: decoded.role
            };
        } catch (err) {
            return null;
        }
    }

    return null;
}
