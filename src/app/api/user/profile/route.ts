import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        secondaryEmails: true,
        secondaryPhones: true,
        role: true,
        isVerified: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("USER_PROFILE_GET_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, imageUrl, secondaryEmails, secondaryPhones } = body;

    // Check uniqueness for any NEW identifiers
    if (secondaryEmails || secondaryPhones) {
       const allNew = [...(secondaryEmails || []), ...(secondaryPhones || [])];
       for (const ident of allNew) {
          const cleanIdent = ident.trim().toLowerCase();
          const existing = await prisma.user.findFirst({
            where: {
               OR: [
                 { email: cleanIdent },
                 { phone: cleanIdent },
                 { secondaryEmails: { has: cleanIdent } },
                 { secondaryPhones: { has: cleanIdent } }
               ],
               NOT: { id: authUser.id }
            }
          });
          if (existing) {
            return NextResponse.json({ error: `The identifier "${ident}" is already in use by another account.` }, { status: 400 });
          }
       }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: name !== undefined ? name : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        phone: phone !== undefined ? phone.replace(/\D/g, '') : undefined,
        secondaryEmails: secondaryEmails !== undefined ? secondaryEmails : undefined,
        secondaryPhones: secondaryPhones !== undefined ? secondaryPhones.map((p: string) => p.replace(/\D/g, '')) : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        imageUrl: updatedUser.imageUrl,
        secondaryEmails: updatedUser.secondaryEmails,
        secondaryPhones: updatedUser.secondaryPhones
      }
    });
  } catch (error: any) {
    console.error("USER_PROFILE_PATCH_ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "This phone number is already in use." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
