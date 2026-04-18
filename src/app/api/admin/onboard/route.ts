import { NextResponse } from "next/server";
import { createClerkClient } from '@clerk/backend';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const businessName = formData.get("businessName") as string;
    const menuFile = formData.get("menuFile") as File;

    const profileData = JSON.parse(formData.get("profileData") as string || "{}");

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // 1. Clerk User
    const clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      password: password,
      firstName: businessName,
      publicMetadata: { role: "SELLER" }
    });

    const clerkId = clerkUser.id;

    // 2. Prisma User & Profile
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          clerkId,
          email,
          name: businessName,
          role: "SELLER",
        }
      });

      await tx.businessProfile.create({
        data: {
          userId: clerkId,
          ...profileData,
          businessName
        }
      });
    });

    // 3. Process Menu if file exists
    if (menuFile) {
      const bytes = await menuFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = xlsx.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = xlsx.utils.sheet_to_json(sheet);

      const categoriesMap = new Map<string, string>();

      for (const row of rows) {
          // Flexible mapping: Try multiple common headers
          const itemName = (row["Item Name"] || row["Name"] || row["item"] || row["DALCHINI — North Indian Restaurant"])?.trim();
          const itemPrice = parseFloat(row["Price"] || row["price"] || row["Rate"] || row["__EMPTY"] || 0);
          const categoryName = (row["Category"] || row["category"] || row["__EMPTY_1"] || "General").trim();

          if (!itemName || itemName === "Item Name") continue;

          if (!categoriesMap.has(categoryName)) {
            const cat = await prisma.category.create({
              data: { name: categoryName, clerkId }
            });
            categoriesMap.set(categoryName, cat.id);
          }

          const categoryId = categoriesMap.get(categoryName)!;

          await prisma.item.create({
            data: {
              name: itemName,
              price: itemPrice,
              categoryId,
              clerkId,
              isActive: true
            }
          });
      }
    }

    return NextResponse.json({ success: true, clerkId });

  } catch (error: any) {
    console.error("ONBOARDING API ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
