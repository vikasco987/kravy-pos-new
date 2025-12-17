// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function POST(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params; // bill id from URL

//     // 1️⃣ Find the bill
//     const bill = await prisma.bill.findUnique({
//       where: { id },
//     });

//     if (!bill) {
//       return NextResponse.json({ message: "Bill not found" }, { status: 404 });
//     }

//     // 2️⃣ Update the bill to mark it as resumed (not held anymore)
//     const resumedBill = await prisma.bill.update({
//       where: { id },
//       data: {
//         isHeld: false,
//         holdAt: null,
//         resumedAt: new Date(),
//       },
//     });

//     // 3️⃣ Fetch updated list of held bills
//     const heldBills = await prisma.bill.findMany({
//       where: { isHeld: true },
//       orderBy: { holdAt: "desc" },
//     });

//     return NextResponse.json(
//       {
//         message: "Bill resumed successfully",
//         resumedBill,
//         heldBills,
//       },
//       { status: 200 }
//     );
//   } catch (err: any) {
//     console.error("Error resuming bill:", err);
//     return NextResponse.json(
//       { message: "Failed to resume bill", error: err.message },
//       { status: 500 }
//     );
//   }
// }






// // src/app/api/bills/[id]/resume/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function POST(req: Request, { params }: { params: { id: string } }) {
//   try {
//     // ✅ Get bill ID from params
//     const id = params.id;

//     // 1️⃣ Find the bill
//     const bill = await prisma.bill.findUnique({ where: { id } });
//     if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

//     // 2️⃣ Update the bill to mark it as resumed (not held anymore)
//     const resumedBill = await prisma.bill.update({
//       where: { id },
//       data: {
//         isHeld: false,
//         holdAt: null,
//         resumedAt: new Date(), // <-- now valid field
//       },
//     });

//     return NextResponse.json({ resumedBill });
//   } catch (err) {
//     console.error("Error resuming bill:", err);
//     return NextResponse.json({ error: "Failed to resume bill" }, { status: 500 });
//   }
// }




// import { prisma } from "@/lib/prisma";

// export async function POST(req: Request, { params }: { params: { id: string } }) {
//   try {
//     const { id } = params; // Bill ID from URL

//     // 1️⃣ Find the bill
//     const bill = await prisma.bill.findUnique({
//       where: { id },
//       include: { products: true }, // ✅ include products
//     });

//     if (!bill) return new Response(JSON.stringify({ error: "Bill not found" }), { status: 404 });

//     // 2️⃣ Update the bill to mark it as resumed
//     const resumedBill = await prisma.bill.update({
//       where: { id },
//       data: {
//         isHeld: false,
//         holdAt: null,
//         resumedAt: new Date(), // <-- your new field
//       },
//       include: { products: true }, // ✅ include products for frontend
//     });

//     return new Response(JSON.stringify({ resumedBill }), { status: 200 });
//   } catch (err) {
//     console.error("Error resuming bill:", err);
//     return new Response(JSON.stringify({ error: "Failed to resume bill" }), { status: 500 });
//   }
// }












// // src/app/api/bills/[id]/resume/route.ts
// import { NextRequest } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function POST(
//   req: NextRequest,
//   context: { params: { id: string } }  // ✅ App Router expects params as object
// ) {
//   try {
//     const { id } = context.params; // Bill ID from URL

//     // 1️⃣ Find the bill
//     const bill = await prisma.bill.findUnique({
//       where: { id },
//       include: { products: true }, // include related products
//     });

//     if (!bill) {
//       return new Response(
//         JSON.stringify({ error: "Bill not found" }),
//         { status: 404 }
//       );
//     }

//     // 2️⃣ Update the bill to mark it as resumed
//     const resumedBill = await prisma.bill.update({
//       where: { id },
//       data: {
//         isHeld: false,
//         holdAt: null,
//         resumedAt: new Date(), // timestamp when resumed
//       },
//       include: { products: true }, // include products for frontend
//     });

//     // ✅ Return the resumed bill
//     return new Response(JSON.stringify({ resumedBill }), { status: 200 });

//   } catch (err) {
//     console.error("Error resuming bill:", err);
//     return new Response(
//       JSON.stringify({ error: "Failed to resume bill" }),
//       { status: 500 }
//     );
//   }
// }





// // src/app/api/bills/[id]/resume/route.ts
// import { prisma } from "@/lib/prisma";
// import { NextRequest } from "next/server";

// // Correct type for context params in App Router
// type Params = { params: { id: string } };

// export async function POST(req: NextRequest, context: Params) {
//   try {
//     const { id } = context.params; // Bill ID from URL

//     // 1️⃣ Find the bill
//     const bill = await prisma.bill.findUnique({
//       where: { id },
//       include: { products: true },
//     });

//     if (!bill) {
//       return new Response(JSON.stringify({ error: "Bill not found" }), {
//         status: 404,
//       });
//     }

//     // 2️⃣ Update the bill to mark it as resumed
//     const resumedBill = await prisma.bill.update({
//       where: { id },
//       data: {
//         isHeld: false,
//         holdAt: null,
//         resumedAt: new Date(),
//       },
//       include: { products: true },
//     });

//     return new Response(JSON.stringify({ resumedBill }), { status: 200 });
//   } catch (err) {
//     console.error("Error resuming bill:", err);
//     return new Response(JSON.stringify({ error: "Failed to resume bill" }), {
//       status: 500,
//     });
//   }
// }










// src/app/api/bills/[id]/resume/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // ✅ Await the params because App Router passes them as a Promise
    const { id } = await context.params;

    // 1️⃣ Find the bill
    const bill = await prisma.bill.findUnique({
  where: { id },
  include: {
    customer: true,
    payments: true,
    history: true,
    // items is Json → no include needed
  },
});


    if (!bill) {
      return new Response(JSON.stringify({ error: "Bill not found" }), { status: 404 });
    }

    // 2️⃣ Update the bill to mark it as resumed
    const resumedBill = await prisma.bill.update({
  where: { id },
  data: {
    isHeld: false,
    resumedAt: new Date(),
  },
  include: {
    customer: true,
    payments: true,
    history: true,
    // items is Json → no include
  },
});


    return new Response(JSON.stringify({ resumedBill }), { status: 200 });
  } catch (err) {
    console.error("Error resuming bill:", err);
    return new Response(JSON.stringify({ error: "Failed to resume bill" }), { status: 500 });
  }
}
