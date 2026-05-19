import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAuthUser } from "@/lib/auth-utils";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
  try {
    const adminUser = await getAuthUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const email = formData.get("email")?.toString();
    const phone = formData.get("phone")?.toString();
    const password = formData.get("password")?.toString();
    const businessName = formData.get("businessName")?.toString();
    const profileDataStr = formData.get("profileData")?.toString() || "{}";
    const profileData = JSON.parse(profileDataStr);

    if (!email || !password || !businessName || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      return NextResponse.json({ error: "Email or phone already in use" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const clerkId = "custom_" + Math.random().toString(36).substring(2, 11);

    // Create Local Custom User & Profile in a Transaction
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          clerkId: clerkId,
          email: email,
          phone: phone,
          password: hashedPassword,
          name: businessName,
          role: "SELLER", // Standard role for merchant admin
          isVerified: true, // Mark verified directly so they don't get OTP verification block on login
        }
      });

      await tx.businessProfile.create({
        data: {
          userId: clerkId,
          businessName: businessName,
          businessAddress: profileData.businessAddress || "",
          businessType: formData.get("businessType")?.toString() || "food",
          contactPersonPhone: phone,
          taxEnabled: false,
          taxRate: 5.0,
          perProductTaxEnabled: false
        }
      });

      return u;
    });

    // Handle Menu Excel if provided
    const menuFile = formData.get("menuFile");
    let itemsCreated = 0;
    
    if (menuFile && menuFile instanceof File) {
      try {
        const buffer = await menuFile.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
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

          const categoriesMap = new Map<string, string>();

          for (const row of dataRows) {
            try {
              const itemName = colMap.name !== -1 ? String(row[colMap.name] || "").trim() : "";
              if (!itemName || itemName.toLowerCase() === "item name" || itemName.toLowerCase() === "name") continue;

              // Price parsing
              const rawPrice = colMap.price !== -1 ? String(row[colMap.price] || "0") : "0";
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
                  userId: user.id,
                  isActive: true,
                  zones: zones
                }
              });
              itemsCreated++;
            } catch (itemErr) {
              console.error("ONBOARD_CUSTOM: Failed to import item row:", row, itemErr);
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse excel:", e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      user,
      itemsImported: itemsCreated
    });

  } catch (error: any) {
    console.error("ONBOARD_CUSTOM_ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to onboard merchant" }, { status: 500 });
  }
}
