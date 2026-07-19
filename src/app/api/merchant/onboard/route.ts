import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, phone, password, restaurantName, address, timings, contactPhone, menu } = body;

        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail || !password || !restaurantName) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: cleanEmail },
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
                email: cleanEmail,
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
            // 1. Extract unique categories
            const uniqueCategories = Array.from(new Set(menu.map((item: any) => item.category || "Uncategorized")));
            
            // 2. Create categories in the database and store their IDs
            const categoryMap = new Map<string, string>();
            for (const catName of uniqueCategories) {
                const newCategory = await prisma.category.create({
                    data: {
                        name: catName as string,
                        clerkId: newClerkId,
                    }
                });
                categoryMap.set(catName as string, newCategory.id);
            }

            // 3. Map items to their respective category IDs
            const menuData = menu.map((item: any) => {
                const catName = item.category || "Uncategorized";
                const categoryId = categoryMap.get(catName) || null;

                return {
                    name: item.name || "Unnamed Item",
                    price: parseFloat(item.price) || 0,
                    sellingPrice: parseFloat(item.price) || 0,
                    imageUrl: item.imageUrl || null,
                    image: item.imageUrl || null,
                    categoryId: categoryId,
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
