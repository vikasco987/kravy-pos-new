// import { NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function DELETE(req: Request, { params }: any) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const billId = params.id;

//     // Check bill exists
//     const bill = await prisma.bill.findUnique({
//       where: { id: billId },
//       include: {
//         products: true,
//         payments: true,
//         history: true,
//       },
//     });

//     if (!bill) {
//       return NextResponse.json({ error: "Bill not found" }, { status: 404 });
//     }

//     // 1️⃣ Delete bill history
//     await prisma.billHistory.deleteMany({
//       where: { billId },
//     });

//     // 2️⃣ Delete bill payments
//     await prisma.payment.deleteMany({
//       where: { billId },
//     });

//     // 3️⃣ Delete bill products
//     await prisma.billProduct.deleteMany({
//       where: { billId },
//     });

//     // 4️⃣ Delete bill now
//     await prisma.bill.delete({
//       where: { id: billId },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Bill deleted successfully",
//       deletedBillId: billId,
//     });
//   } catch (err) {
//     console.error("DELETE BILL ERROR →", err);
//     return NextResponse.json(
//       { error: "Server error", details: String(err) },
//       { status: 500 }
//     );
//   }
// }









// import { NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function DELETE(req: Request, { params }: any) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const billId = params.id;

//     // 1️⃣ Get complete bill snapshot
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

//     // 2️⃣ Save snapshot into DeleteHistory
//     await prisma.deleteHistory.create({
//       data: {
//         billId,
//         deletedBy: userId,
//         snapshot: bill,
//       },
//     });

//     // 3️⃣ Delete bill products
//     await prisma.billProduct.deleteMany({
//       where: { billId },
//     });

//     // 4️⃣ Delete bill payments
//     await prisma.payment.deleteMany({
//       where: { billId },
//     });

//     // 5️⃣ Delete bill history (IMPORTANT FIX)
//     await prisma.billHistory.deleteMany({
//       where: { billId },
//     });

//     // 6️⃣ Finally delete bill
//     await prisma.bill.delete({
//       where: { id: billId },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Bill deleted successfully (and saved in DeleteHistory)",
//     });

//   } catch (err) {
//     console.error("DELETE BILL ERROR →", err);
//     return NextResponse.json(
//       { error: "Server error", details: String(err) },
//       { status: 500 }
//     );
//   }
// }





















// import { NextResponse, NextRequest } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const billId = params.id;

//     // 1️⃣ Get complete bill snapshot
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

//     // 2️⃣ Save snapshot into DeleteHistory
//     await prisma.deleteHistory.create({
//       data: {
//         billId,
//         deletedBy: userId,
//         snapshot: bill,
//       },
//     });

//     // 3️⃣ Delete bill products
//     await prisma.billProduct.deleteMany({
//       where: { billId },
//     });

//     // 4️⃣ Delete bill payments
//     await prisma.payment.deleteMany({
//       where: { billId },
//     });

//     // 5️⃣ Delete bill history
//     await prisma.billHistory.deleteMany({
//       where: { billId },
//     });

//     // 6️⃣ Finally delete bill
//     await prisma.bill.delete({
//       where: { id: billId },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Bill deleted successfully (and saved in DeleteHistory)",
//     });

//   } catch (err) {
//     console.error("DELETE BILL ERROR →", err);
//     return NextResponse.json(
//       { error: "Server error", details: String(err) },
//       { status: 500 }
//     );
//   }
// }






// import { NextResponse, NextRequest } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// // ✔ Correct typing: context.params is NOT a Promise
// export async function DELETE(
//   req: NextRequest,
//   context: { params: { id: string } }
// ) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const billId = context.params.id;

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
//         snapshot: bill,
//       },
//     });

//     // 3️⃣ Delete related products
//     await prisma.billProduct.deleteMany({
//       where: { billId },
//     });

//     // 4️⃣ Delete related payments
//     await prisma.payment.deleteMany({
//       where: { billId },
//     });

//     // 5️⃣ Delete bill history
//     await prisma.billHistory.deleteMany({
//       where: { billId },
//     });

//     // 6️⃣ Delete the bill
//     await prisma.bill.delete({
//       where: { id: billId },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Bill deleted successfully (and saved in DeleteHistory)",
//     });

//   } catch (err) {
//     console.error("DELETE BILL ERROR →", err);
//     return NextResponse.json(
//       { error: "Server error", details: String(err) },
//       { status: 500 }
//     );
//   }
// }


















import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// ✔ Correct Next.js typing with destructured params
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billId = params.id;

    // 1️⃣ Fetch full bill snapshot
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        products: true,
        payments: true,
        customer: true,
        user: true,
        history: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // 2️⃣ Save snapshot in DeleteHistory
    await prisma.deleteHistory.create({
      data: {
        billId,
        deletedBy: userId,
        snapshot: bill,
      },
    });

    // 3️⃣ Delete related products
    await prisma.billProduct.deleteMany({
      where: { billId },
    });

    // 4️⃣ Delete related payments
    await prisma.payment.deleteMany({
      where: { billId },
    });

    // 5️⃣ Delete bill history entries
    await prisma.billHistory.deleteMany({
      where: { billId },
    });

    // 6️⃣ Finally delete the bill
    await prisma.bill.delete({
      where: { id: billId },
    });

    return NextResponse.json(
      { success: true, message: "Bill deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /billing/delete/[id] error:", error);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
