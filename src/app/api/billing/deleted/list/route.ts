// import { NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function GET(req: Request) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const deleted = await prisma.deleteHistory.findMany({
//       orderBy: { deletedAt: "desc" }, // FIXED
//     });

//     return NextResponse.json({ deleted });
//   } catch (err) {
//     console.error("FETCH DELETE HISTORY ERROR →", err);
//     return NextResponse.json(
//       { error: "Server error", details: String(err) },
//       { status: 500 }
//     );
//   }
// }






















// import { NextRequest, NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function GET(req: NextRequest) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Fetch deleted bills for this user
//     const deletedBills = await prisma.deleteHistory.findMany({
//       where: { deletedBy: userId },
//       orderBy: { deletedAt: "desc" },
//     });

//     return NextResponse.json({
//       bills: deletedBills, // ✅ Return in same structure as frontend expects
//     });
//   } catch (err) {
//     console.error("FETCH DELETE HISTORY ERROR →", err);
//     return NextResponse.json(
//       { error: "Server error", details: String(err) },
//       { status: 500 }
//     );
//   }
// }













// import { prisma } from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";

// export async function GET() {
//   try {
//     const clerkUser = await currentUser();
//     if (!clerkUser) {
//       return new Response(JSON.stringify({ error: "Unauthorized" }), {
//         status: 401,
//       });
//     }

//     const bills = await prisma.bill.findMany({
//       where: {
//         OR: [
//           { clerkUserId: clerkUser.id },        // NEW bills
//           { user: { clerkId: clerkUser.id } },  // OLD bills
//         ],
//       },
//       orderBy: { createdAt: "desc" },
//       include: {
//         customer: true,
//         products: {
//           include: { product: true },
//         },
//         payments: true,
//       },
//     });

//     // ✅ TEMP FIX (Solution B)
//     const cleaned = bills.map((bill) => ({
//       ...bill,
//       products: bill.products.map((bp) => ({
//         ...bp,

//         // Fix null productName (Prisma error)
//         productName: bp.productName ?? "Unknown Product",

//         // Fix missing Product relation
//         product:
//           bp.product ||
//           {
//             id: null,
//             name: bp.productName ?? "Unknown Product",
//             price: bp.price || 0,
//           },
//       })),
//     }));

//     return new Response(JSON.stringify({ bills: cleaned }), {
//       status: 200,
//       headers: { "Cache-Control": "no-store" },
//     });
//   } catch (err) {
//     console.error("❌ Error fetching bills:", err);
//     return new Response(JSON.stringify({ error: "Failed to fetch bills" }), {
//       status: 500,
//     });
//   }
// }




import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.deleteHistory.findMany({
      orderBy: { deletedAt: "desc" }, // FIXED
    });

    return NextResponse.json({ deleted });
  } catch (err) {
    console.error("FETCH DELETE HISTORY ERROR →", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
