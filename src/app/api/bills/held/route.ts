// // File: src/app/api/bills/held/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server"; // Get authenticated user from session

// export async function GET(req: Request) {
//   try {
//     const url = new URL(req.url);
//     let userClerkId = url.searchParams.get("userClerkId");

//     // ✅ If userClerkId not provided, try getting from logged-in session
//     if (!userClerkId) {
//       const { userId } = getAuth(req);
//       if (!userId) {
//         return NextResponse.json(
//           { message: "Missing userClerkId or not logged in" },
//           { status: 400 }
//         );
//       }
//       userClerkId = userId;
//     }

//     // ✅ Find user in DB
//     const dbUser = await prisma.user.findUnique({ where: { clerkId: userClerkId } });
//     if (!dbUser) {
//       return NextResponse.json({ message: "Invalid user" }, { status: 400 });
//     }

//     // ✅ Fetch held bills
//     const heldBills = await prisma.bill.findMany({
//       where: { isHeld: true, userId: dbUser.id },
//       include: { customer: true, products: { include: { product: true } } },
//       orderBy: { holdAt: "desc" },
//     });

//     // ✅ Convert IDs to string for frontend
//     const billsWithStringIds = heldBills.map((b) => ({
//       ...b,
//       id: b.id.toString(),
//     }));

//     return NextResponse.json(billsWithStringIds);
//   } catch (error: any) {
//     console.error("Error fetching held bills:", error);
//     return NextResponse.json(
//       { message: "Failed to fetch held bills" },
//       { status: 500 }
//     );
//   }
// }















// File: src/app/api/bills/held/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server"; // Get authenticated user from session

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let userClerkId = url.searchParams.get("userClerkId");

    // ✅ If userClerkId not provided, try getting from logged-in session
    if (!userClerkId) {
      const { userId } = getAuth(req); // ✅ req is NextRequest
      if (!userId) {
        return NextResponse.json(
          { message: "Missing userClerkId or not logged in" },
          { status: 400 }
        );
      }
      userClerkId = userId;
    }

    // ✅ Find user in DB
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userClerkId } });
    if (!dbUser) {
      return NextResponse.json({ message: "Invalid user" }, { status: 400 });
    }

    // ✅ Fetch held bills
    const heldBills = await prisma.bill.findMany({
  where: {
    isHeld: true,
    userId: dbUser.id,
  },
  include: {
    customer: true,
    payments: true,
    history: true,
    // items is Json → no include needed
  },
  orderBy: {
    holdAt: "desc",
  },
});

    // ✅ Convert IDs to string for frontend
    const billsWithStringIds = heldBills.map((b) => ({
      ...b,
      id: b.id.toString(),
    }));

    return NextResponse.json(billsWithStringIds);
  } catch (error: any) {
    console.error("Error fetching held bills:", error);
    return NextResponse.json(
      { message: "Failed to fetch held bills" },
      { status: 500 }
    );
  }
}
