


// import { NextResponse, NextRequest } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function DELETE(
//   req: NextRequest,
//   context: { params: { id: string } }
// ) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id: billId } = context.params;

//     // 1️⃣ Fetch full bill snapshot
//     const bill = await prisma.bill.findUnique({
//       where: { id: billId },
//       include: {
//         products: true,
//         payments: true,
//         customer: true,
//         user: true,
//         history: true,
//       },
//     });

//     if (!bill) {
//       return NextResponse.json({ error: "Bill not found" }, { status: 404 });
//     }

//     // 2️⃣ Save snapshot in DeleteHistory
//     await prisma.deleteHistory.create({
//       data: {
//         billId,
//         deletedBy: userId,
//         snapshot: bill, // or JSON.stringify(bill) if your schema uses String
//       },
//     });

//     // 3️⃣ Delete related products
//     await prisma.billProduct.deleteMany({ where: { billId } });

//     // 4️⃣ Delete related payments
//     await prisma.payment.deleteMany({ where: { billId } });

//     // 5️⃣ Delete bill history
//     await prisma.billHistory.deleteMany({ where: { billId } });

//     // 6️⃣ Finally delete the bill
//     await prisma.bill.delete({
//       where: { id: billId },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Bill deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete error:", error);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk auth (async – correct for your setup)
    const session = await auth();
    const clerkUserId = session.userId;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Next.js 16 params are async
    const { id: billId } = await context.params;

    // Fetch bill
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        clerkUserId,
      },
      include: {
        payments: true,
        customer: true,
        user: true,
        history: true,
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    // Save delete snapshot
    await prisma.billHistory.create({
      data: {
        billId,
        action: "DELETED",
        snapshot: bill,
      },
    });

    // Delete dependent records first
    await prisma.payment.deleteMany({
      where: { billId },
    });

    await prisma.billHistory.deleteMany({
      where: { billId },
    });

    // Delete main bill last
    await prisma.bill.delete({
      where: { id: billId },
    });

    return NextResponse.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    console.error("Billing DELETE error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
