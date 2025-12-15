// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function GET(_: Request, { params }: { params: { id: string } }) {
//   try {
//     const bill = await prisma.bill.findUnique({
//       where: { id: params.id },
//       include: {
//         products: { include: { product: true } },
//         payments: true,
//         customer: true,
//         history: true,
//       },
//     });

//     if (!bill) {
//       return NextResponse.json({ message: "Bill not found" }, { status: 404 });
//     }

//     return NextResponse.json(bill);
//   } catch (error: any) {
//     console.error("Error fetching bill:", error);
//     return NextResponse.json({ message: "Failed to fetch bill" }, { status: 500 });
//   }
// }

// export async function PUT(req: Request, { params }: { params: { id: string } }) {
//   try {
//     const body = await req.json();
//     const { paymentStatus, paymentMode, notes } = body;

//     const updated = await prisma.bill.update({
//       where: { id: params.id },
//       data: {
//         paymentStatus,
//         paymentMode,
//         notes,
//         history: { create: { snapshot: body } },
//       },
//     });

//     return NextResponse.json(updated);
//   } catch (error: any) {
//     console.error("Error updating bill:", error);
//     return NextResponse.json({ message: "Failed to update bill" }, { status: 500 });
//   }
// }







// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// // ✅ GET single bill by ID
// export async function GET(
//   _request: Request,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await context.params; // ✅ must await this

//     const bill = await prisma.bill.findUnique({
//       where: { id },
//       include: {
//         products: { include: { product: true } },
//         payments: true,
//         customer: true,
//         history: true,
//       },
//     });

//     if (!bill) {
//       return NextResponse.json({ message: "Bill not found" }, { status: 404 });
//     }

//     return NextResponse.json(bill);
//   } catch (error: any) {
//     console.error("Error fetching bill:", error);
//     return NextResponse.json(
//       { message: "Failed to fetch bill" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ PUT update bill info
// export async function PUT(
//   req: Request,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await context.params; // ✅ must await this
//     const body = await req.json();
//     const { paymentStatus, paymentMode, notes } = body;

//     const updated = await prisma.bill.update({
//       where: { id },
//       data: {
//         paymentStatus,
//         paymentMode,
//         notes,
//         history: { create: { snapshot: body } },
//       },
//     });

//     return NextResponse.json(updated);
//   } catch (error: any) {
//     console.error("Error updating bill:", error);
//     return NextResponse.json(
//       { message: "Failed to update bill" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: { id?: string } }
) {
  try {
    const billId = context?.params?.id;

    // 🛑 HARD GUARD
    if (!billId || typeof billId !== "string") {
      return NextResponse.json(
        { message: "Bill ID is required" },
        { status: 400 }
      );
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        products: true,
        customer: true,
        history: true,
      },
    });

    if (!bill) {
      return NextResponse.json(
        { message: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error("Fetch bill error:", error);
    return NextResponse.json(
      { message: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}
