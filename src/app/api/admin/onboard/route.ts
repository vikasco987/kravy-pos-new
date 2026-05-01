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
    console.log("ONBOARDING: Checking if user already exists in Clerk:", email);
    let clerkUser;
    
    try {
      // Check if user already exists in Clerk
      const existingClerkUsers = await clerk.users.getUserList({ emailAddress: [email] });
      if (existingClerkUsers.data.length > 0) {
        console.log("ONBOARDING: User already exists in Clerk. Linking...");
        clerkUser = existingClerkUsers.data[0];
      } else {
        console.log("ONBOARDING: Creating fresh Clerk user for", email);
        const nameParts = (businessName || "Merchant Owner").split(" ");
        const fName = nameParts[0];
        const lName = nameParts.slice(1).join(" ") || "Owner";

        clerkUser = await clerk.users.createUser({
          emailAddress: [email],
          password: password,
          firstName: fName,
          lastName: lName,
          publicMetadata: { role: "SELLER" }
        });
      }
    } catch (err: any) {
      console.error("CLERK API ERROR:", err);
      if (err.errors) {
        console.error("CLERK ERROR DETAILS:", JSON.stringify(err.errors, null, 2));
        const messages = err.errors.map((e: any) => e.longMessage || e.message || "Unknown Clerk error").join(", ");
        return NextResponse.json({ error: `Clerk Error: ${messages}` }, { status: 422 });
      }
      return NextResponse.json({ error: err.message || "Clerk authentication service failure" }, { status: 500 });
    }

    const clerkId = clerkUser.id;

    // 2. Prisma User & Profile
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.upsert({
        where: { clerkId },
        update: {
          email,
          name: businessName,
          role: "SELLER"
        },
        create: {
          clerkId,
          email,
          name: businessName,
          role: "SELLER",
        }
      });

      await tx.businessProfile.upsert({
        where: { userId: clerkId },
        update: {
          businessName,
          businessAddress: profileData.businessAddress,
          businessType: profileData.businessType,
          contactPersonPhone: profileData.contactPhone,
        },
        create: {
          userId: clerkId,
          businessName,
          businessAddress: profileData.businessAddress,
          businessType: profileData.businessType,
          contactPersonPhone: profileData.contactPhone,
        }
      });

      return u;
    });

    const dbUserId = user.id;

    // 3. Process Menu if file exists
    if (menuFile) {
      console.log("ONBOARDING: Processing menu file...");
      const bytes = await menuFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = xlsx.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Use header: 1 to get raw rows for header detection
      const allRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      if (allRows.length > 0) {
        // Find header row (scan first 10 rows)
        let headerIndex = 0;
        const keywords = ["name", "item", "price", "mrp", "rate", "category", "desc", "nam", "किमत", "मूल्य", "dish"];
        
        for (let i = 0; i < Math.min(10, allRows.length); i++) {
          const row = (allRows[i] || []).map(c => String(c || "").toLowerCase());
          const matchCount = row.filter(cell => keywords.some(k => cell.includes(k))).length;
          if (matchCount >= 2) {
            headerIndex = i;
            break;
          }
        }

        const headers = (allRows[headerIndex] || []).map(h => String(h || "").trim());
        const dataRows = allRows.slice(headerIndex + 1);

        // Auto-mapping columns
        const findCol = (regex: RegExp) => headers.findIndex(h => regex.test(h));
        const colMap = {
          name: findCol(/name|dish|item|title|उत्पाद|नाम/i),
          price: findCol(/price|selling|mrp|cost|rate|purchase|मूल्य|कीमत/i),
          category: findCol(/category|group|type|श्रेणी|वर्ग/i),
          description: findCol(/desc|info|detail|composition|विवरण/i),
          imageUrl: findCol(/image|url|photo|img|link|फोटो/i),
          zones: findCol(/zone|area|section|location|स्थान/i)
        };

        console.log("ONBOARDING: Column Mapping found:", colMap);

        const categoriesMap = new Map<string, string>();

        let successCount = 0;
        let failCount = 0;

        for (const row of dataRows) {
          try {
            const itemName = colMap.name !== -1 ? String(row[colMap.name] || "").trim() : "";
            if (!itemName || itemName.toLowerCase() === "item name" || itemName.toLowerCase() === "name") continue;

            // Price parsing (handle commas and currency symbols)
            const rawPrice = colMap.price !== -1 ? String(row[colMap.price] || "0") : "0";
            // Remove everything except digits, dots and minus sign
            const itemPrice = parseFloat(rawPrice.replace(/,/g, "").replace(/[^\d.-]/g, "")) || 0;

            // Category handling
            let categoryName = colMap.category !== -1 ? String(row[colMap.category] || "General").trim() : "General";
            if (!categoryName) categoryName = "General";

            if (!categoriesMap.has(categoryName)) {
              let cat = await prisma.category.findFirst({
                where: { name: categoryName, clerkId }
              });
              
              if (!cat) {
                cat = await prisma.category.create({
                  data: { name: categoryName, clerkId }
                });
              }
              categoriesMap.set(categoryName, cat.id);
            }

            const categoryId = categoriesMap.get(categoryName)!;

            // Zone handling
            const zoneRaw = colMap.zones !== -1 ? String(row[colMap.zones] || "").trim() : "";
            const zones = zoneRaw ? zoneRaw.split(",").map(z => z.trim().toUpperCase()).filter(Boolean) : [];

            await prisma.item.create({
              data: {
                name: itemName,
                description: colMap.description !== -1 ? String(row[colMap.description] || "").trim() : null,
                price: itemPrice,
                sellingPrice: itemPrice,
                imageUrl: colMap.imageUrl !== -1 ? String(row[colMap.imageUrl] || "").trim() : null,
                categoryId,
                clerkId,
                userId: dbUserId,
                isActive: true,
                zones: zones
              }
            });
            successCount++;
          } catch (itemErr) {
            console.error("ONBOARDING: Failed to import item row:", row, itemErr);
            failCount++;
          }
        }
        console.log(`ONBOARDING: Processed ${dataRows.length} rows. Success: ${successCount}, Fail: ${failCount}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      clerkId,
      message: "Onboarding completed successfully"
    });

  } catch (error: any) {
    console.error("ONBOARDING API ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
