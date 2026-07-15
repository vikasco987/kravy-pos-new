import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, phone, password, restaurantName, address, timings, contactPhone, menu } = body;

        if (!email || !password || !restaurantName) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone: phone }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json({ success: false, error: "User with this email or phone already exists." }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newClerkId = `custom_${uuidv4()}`;

        // Create User
        const newUser = await prisma.user.create({
            data: {
                email,
                phone,
                password: hashedPassword,
                name: restaurantName,
                role: "SELLER",
                isVerified: true, // Auto-verify account
                clerkId: newClerkId, // Fallback for clerkId requirement
            }
        });

        // Create Business Profile
        await prisma.businessProfile.create({
            data: {
                userId: newClerkId,
                businessName: restaurantName,
                businessAddress: address || "",
                contactPersonPhone: contactPhone || phone,
                businessEmail: email,
                enableCustomAuth: true,
            }
        });

        // If menu items are provided, insert them
        if (menu && Array.isArray(menu) && menu.length > 0) {
            const menuData = menu.map((item: any) => {
                let categoryId = null;
                // Since creating categories perfectly via raw import is complex, 
                // we map the item string category for the frontend or create basic items
                return {
                    name: item.name || "Unnamed Item",
                    price: parseFloat(item.price) || 0,
                    sellingPrice: parseFloat(item.price) || 0,
                    imageUrl: item.imageUrl || null,
                    image: item.imageUrl || null,
                    clerkId: newClerkId,
                    userId: newUser.id,
                    isActive: true
                };
            });

            await prisma.item.createMany({
                data: menuData
            });
        }

        return NextResponse.json({ success: true, message: "Merchant onboarded successfully", user: { email: newUser.email, id: newUser.id } });

    } catch (error: any) {
        console.error("Onboarding Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to onboard merchant" }, { status: 500 });
    }
}
