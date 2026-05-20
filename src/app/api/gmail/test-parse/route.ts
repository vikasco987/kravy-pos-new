import { NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { parseEmail } from "@/lib/email-parser";

export async function POST(req: Request) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { platform, content, saveToDb, date } = await req.json();

        if (!content) {
            return NextResponse.json({ error: "Email content is required" }, { status: 400 });
        }

        const result = parseEmail({
            id: "test-msg-id",
            subject: platform === "zomato" ? "Zomato Daily Sales Summary Report" : "Swiggy Daily Sales Performance Summary",
            sender: platform === "zomato" ? "noreply@zomato.com" : "reports@swiggy.in",
            date: date || new Date().toISOString(),
            snippet: content.substring(0, 300),
            body: content
        });

        if (!result) {
            return NextResponse.json({ 
                success: false, 
                error: "Parser returned null. The email format did not match the expected pattern." 
            });
        }

        // If user wants to mock save this parsed record to the database
        if (saveToDb) {
            const recordDate = date ? new Date(date) : new Date();
            
            // Check if record already exists for this date and platform
            const startOfDay = new Date(recordDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(recordDate);
            endOfDay.setHours(23, 59, 59, 999);

            const existing = await prisma.externalSales.findFirst({
                where: {
                    clerkUserId: effectiveId,
                    platform,
                    date: { gte: startOfDay, lte: endOfDay }
                }
            });

            if (existing) {
                await prisma.externalSales.update({
                    where: { id: existing.id },
                    data: {
                        totalOrders: result.totalOrders,
                        totalRevenue: result.totalRevenue,
                        cancelledOrders: result.cancelledOrders,
                        avgOrderValue: result.avgOrderValue,
                        rating: result.rating,
                        lastEmailId: result.lastEmailId
                    }
                });
            } else {
                await prisma.externalSales.create({
                    data: {
                        clerkUserId: effectiveId,
                        platform,
                        date: recordDate,
                        totalOrders: result.totalOrders,
                        totalRevenue: result.totalRevenue,
                        cancelledOrders: result.cancelledOrders,
                        avgOrderValue: result.avgOrderValue,
                        rating: result.rating,
                        lastEmailId: result.lastEmailId
                    }
                });
            }
        }

        return NextResponse.json({ 
            success: true, 
            parsed: result 
        });
    } catch (err: any) {
        console.error("Test parse error:", err);
        return NextResponse.json({ error: err.message || "Failed to parse email content" }, { status: 500 });
    }
}
