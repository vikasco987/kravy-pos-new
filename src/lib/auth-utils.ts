import { auth } from '@clerk/nextjs/server';
import prisma from './prisma';

export async function getEffectiveClerkId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // Check if this user is a staff member (has an ownerId)
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { ownerId: true }
  });

  // If they have an ownerId, return it. Otherwise return their own userId.
  return user?.ownerId || userId;
}
