



import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const bills = await prisma.bill.findMany({
      where: {
        OR: [
          { clerkUserId: clerkUser.id },        // NEW bills
          { user: { clerkId: clerkUser.id } },  // OLD bills
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        products: {
          include: { product: true },
        },
        payments: true,
      },
    });

    // ✅ TEMP FIX (Solution B)
    const cleaned = bills.map((bill) => ({
      ...bill,
      products: bill.products.map((bp) => ({
        ...bp,

        // Fix null productName (Prisma error)
        productName: bp.productName ?? "Unknown Product",

        // Fix missing Product relation
        product:
          bp.product ||
          {
            id: null,
            name: bp.productName ?? "Unknown Product",
            price: bp.price || 0,
          },
      })),
    }));

    return new Response(JSON.stringify({ bills: cleaned }), {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("❌ Error fetching bills:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch bills" }), {
      status: 500,
    });
  }
}
