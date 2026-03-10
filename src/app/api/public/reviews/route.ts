import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/reviews?clerkUserId=<id>&itemId=<itemId>
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clerkUserId = searchParams.get("clerkUserId");
        const itemId = searchParams.get("itemId");

        if (!clerkUserId) {
            return NextResponse.json({ error: "clerkUserId is required" }, { status: 400 });
        }

        const reviews = await prisma.review.findMany({
            where: {
                clerkUserId,
                ...(itemId ? { itemId } : {})
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 20
        });

        return NextResponse.json(reviews);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

// POST /api/public/reviews
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { clerkUserId, itemId, rating, comment, customerName, tableId, imageUrl } = body;

        if (!clerkUserId || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const review = await prisma.review.create({
            data: {
                clerkUserId,
                itemId: itemId || null,
                rating: Number(rating),
                comment: comment || null,
                customerName: customerName || "Guest",
                tableId: tableId || null,
                imageUrl: imageUrl || null
            }
        });

        // Optionally update Item rating average here
        if (itemId) {
            const avg = await prisma.review.aggregate({
                where: { itemId },
                _avg: { rating: true }
            });
            if (avg._avg.rating) {
                await prisma.item.update({
                    where: { id: itemId },
                    data: { rating: avg._avg.rating }
                });
            }
        }

        // Reward Loyalty points (+50) if phone provided
        if (body.customerPhone && clerkUserId) {
            await prisma.party.upsert({
                where: {
                    phone_createdBy: {
                        phone: body.customerPhone,
                        createdBy: clerkUserId
                    }
                },
                update: {
                    loyaltyPoints: { increment: 50 },
                    name: customerName || "Guest"
                },
                create: {
                    phone: body.customerPhone,
                    createdBy: clerkUserId,
                    loyaltyPoints: 50,
                    name: customerName || "Guest"
                }
            });

            // Also log as an activity maybe? Or just loyalty record
        }

        return NextResponse.json(review);
    } catch (error) {
        console.error("REVIEW_POST_ERROR:", error);
        return NextResponse.json({ error: "Failed to post review" }, { status: 500 });
    }
}
