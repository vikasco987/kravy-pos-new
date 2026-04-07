import { auth } from '@clerk/nextjs/server';
import prisma from './prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

/**
 * Returns the effective Clerk ID (the Owner's ID) for the current user.
 * Works for both Owners (direct Clerk user) and Staff (referenced via ownerId/businessId).
 */
export async function getEffectiveClerkId(): Promise<string | null> {
  // 1. Try Clerk Auth (for Owners or Staff created via Clerk)
  const { userId } = await auth();
  
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { ownerId: true }
    });
    return user?.ownerId || userId;
  }

  // 2. Try Custom JWT Auth (for Prisma-only Staff)
  const authHeader = (await cookies()).get('staff_token')?.value; 
  // Note: App and Browser can send token in cookie or Header. You can check both.
  
  if (authHeader) {
      try {
          const decoded: any = jwt.verify(authHeader, JWT_SECRET);
          return decoded.businessId; // Decoded businessId is the Seller's Clerk ID
      } catch (err) {
          return null;
      }
  }

  return null;
}

export type AuthUser = {
    id: string;
    type: 'ADMIN' | 'SELLER' | 'STAFF' | 'OWNER'; // Added OWNER just in case
    businessId: string;
    permissions: string[];
    name?: string;
    email?: string;
    role?: string; // Original DB role
}

/**
 * High-level auth check to determine who is making the request.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    // 1. Check Clerk (Owner or Clerk-linked Staff)
    const { userId } = await auth();
    if (userId) {
        // Find user in DB to see if they are a legacy staff or the owner
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (user) {
            return {
                id: user.id,
                type: (user.ownerId ? 'STAFF' : (user.role as any)) || 'OWNER',
                businessId: user.ownerId || user.clerkId,
                permissions: user.allowedPaths, // We use allowedPaths as permissions for legacy staff
                name: user.name,
                email: user.email,
                role: user.role
            };
        }
    }

    // 2. Check Custom JWT (Staff)
    // Checking both cookie and header for maximum compatibility (App vs Browser)
    const token = (await cookies()).get('staff_token')?.value;

    if (token) {
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            return {
                id: decoded.staffId,
                type: 'STAFF',
                businessId: decoded.businessId,
                permissions: decoded.permissions,
                name: decoded.name,
                email: decoded.email
            };
        } catch (err) {
            return null;
        }
    }

    return null;
}
