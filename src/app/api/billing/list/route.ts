



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
      payments: true,
      // items is Json → automatically included, no need for include
      },
    });

    // ✅ TEMP FIX (Solution B)
    const cleaned = bills.map((bill) => ({
  ...bill,
  items: Array.isArray(bill.items) ? bill.items : [],
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
