// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       userId,
//       customerId,
//       companyName,
//       companyAddress,
//       companyPhone,
//       contactPerson,
//       logoUrl,
//       signatureUrl,
//       websiteUrl,
//       products, // [{ productId, quantity, price, discount, gst, total }]
//       total,
//       discount,
//       gst,
//       grandTotal,
//       paymentMode,
//       paymentStatus,
//       notes,
//       dueDate,
//     } = body;

//     // ✅ Validate required fields
//     if (!userId || !products?.length) {
//       return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
//     }

//     // ✅ Create Bill with nested products
//     const bill = await prisma.bill.create({
//       data: {
//         userId,
//         customerId,
//         total,
//         discount,
//         gst,
//         grandTotal,
//         paymentMode,
//         paymentStatus,
//         notes,
//         dueDate: dueDate ? new Date(dueDate) : null,
//         companyName,
//         companyAddress,
//         companyPhone,
//         contactPerson,
//         logoUrl,
//         signatureUrl,
//         websiteUrl,
//         products: {
//           create: products.map((p: any) => ({
//             productId: p.productId,
//             quantity: p.quantity,
//             price: p.price,
//             discount: p.discount,
//             gst: p.gst,
//             total: p.total,
//           })),
//         },
//         history: {
//           create: {
//             snapshot: {
//               companyName,
//               companyAddress,
//               companyPhone,
//               contactPerson,
//               logoUrl,
//               signatureUrl,
//               websiteUrl,
//               products,
//               total,
//               discount,
//               gst,
//               grandTotal,
//               paymentMode,
//               paymentStatus,
//               notes,
//               dueDate,
//             },
//           },
//         },
//       },
//       include: {
//         products: { include: { product: true } },
//         customer: true,
//         payments: true,
//         history: true,
//       },
//     });

//     return NextResponse.json(bill);
//   } catch (error: any) {
//     console.error("Error creating bill:", error);
//     return NextResponse.json(
//       { message: "Failed to create bill", error: error.message },
//       { status: 500 }
//     );
//   }
// // }



// // File: C:\Users\VIKASH\billing-backend\src\app\api\billing\route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       userClerkId, // <-- pass clerkId from frontend
//       customerId,
//       products, // [{ productId, quantity, price, discount, gst, total }]
//       total,
//       discount,
//       gst,
//       grandTotal,
//       paymentMode,
//       paymentStatus,
//       notes,
//       dueDate,
//     } = body;

//     // ✅ Validate required fields
//     if (!userClerkId || !products?.length) {
//       return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
//     }

//     // ✅ Fetch MongoDB _id for the user
//     const user = await prisma.user.findUnique({
//       where: { clerkId: userClerkId },
//     });
//     if (!user) {
//       return NextResponse.json({ message: "Invalid user" }, { status: 400 });
//     }

//     // ✅ Create Bill with nested products
//     const bill = await prisma.bill.create({
//       data: {
//         userId: user.id, // must be MongoDB ObjectId
//         customerId: customerId || undefined, // optional
//         total,
//         discount,
//         gst,
//         grandTotal,
//         paymentMode,
//         paymentStatus,
//         notes,
//         dueDate: dueDate ? new Date(dueDate) : undefined,
//         products: {
//           create: products.map((p: any) => ({
//             productId: p.productId,
//             quantity: p.quantity,
//             price: p.price,
//             discount: p.discount,
//             gst: p.gst,
//             total: p.total,
//           })),
//         },
//         history: {
//           create: {
//             snapshot: {
//               products,
//               total,
//               discount,
//               gst,
//               grandTotal,
//               paymentMode,
//               paymentStatus,
//               notes,
//               dueDate,
//             },
//           },
//         },
//       },
//       include: {
//         products: { include: { product: true } },
//         customer: true,
//         payments: true,
//         history: true,
//       },
//     });

//     return NextResponse.json(bill);
//   } catch (error: any) {
//     console.error("Error creating bill:", error);
//     return NextResponse.json(
//       { message: "Failed to create bill", error: error.message },
//       { status: 500 }
//     );
//   }
// }













// // File: src/app/api/billing/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// interface ProductInput {
//   productId: string;
//   quantity: number;
//   price: number;
//   discount?: number;
//   gst?: number;
//   total: number;
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       userClerkId,
//       customerId,
//       products,
//       total,
//       discount,
//       gst,
//       grandTotal,
//       paymentMode,
//       paymentStatus,
//       notes,
//       dueDate,
//       companyName,
//       companyAddress,
//       companyPhone,
//       contactPerson,
//       logoUrl,
//       signatureUrl,
//       websiteUrl,
//     } = body;

//     if (!userClerkId || !products?.length) {
//       return NextResponse.json({ message: "Missing required fields or products" }, { status: 400 });
//     }

//     const dbUser = await prisma.user.findUnique({
//       where: { clerkId: userClerkId },
//     });
//     if (!dbUser) {
//       return NextResponse.json({ message: "Invalid user" }, { status: 400 });
//     }

//     // Filter valid products
//     const validItems = await prisma.item.findMany({
//       where: { id: { in: products.map((p: ProductInput) => p.productId) } },
//     });
//     const validProductIds = validItems.map((i) => i.id);
//     const validProducts = (products as ProductInput[]).filter((p) =>
//       validProductIds.includes(p.productId)
//     );

//     if (!validProducts.length) {
//       return NextResponse.json({ message: "No valid products provided" }, { status: 400 });
//     }

//     const bill = await prisma.bill.create({
//       data: {
//         userId: dbUser.id,
//         customerId: customerId || undefined,
//         total,
//         discount,
//         gst,
//         grandTotal,
//         paymentMode,
//         paymentStatus,
//         notes,
//         dueDate: dueDate ? new Date(dueDate) : undefined,

//         // Optional company fields
//         companyName: companyName || undefined,
//         companyAddress: companyAddress || undefined,
//         companyPhone: companyPhone || undefined,
//         contactPerson: contactPerson || undefined,
//         logoUrl: logoUrl || undefined,
//         signatureUrl: signatureUrl || undefined,
//         websiteUrl: websiteUrl || undefined,

//         products: {
//           create: validProducts.map((p) => ({
//             productId: p.productId,
//             quantity: p.quantity,
//             price: p.price,
//             discount: p.discount,
//             gst: p.gst,
//             total: p.total,
//           })),
//         },

//         history: {
//           create: {
//             snapshot: {
//               products: validProducts,
//               total,
//               discount,
//               gst,
//               grandTotal,
//               paymentMode,
//               paymentStatus,
//               notes,
//               dueDate,
//               companyName,
//               companyAddress,
//               companyPhone,
//               contactPerson,
//               logoUrl,
//               signatureUrl,
//               websiteUrl,
//             },
//           },
//         },
//       },
//       include: {
//         products: { include: { product: true } },
//         customer: true,
//         payments: true,
//         history: true,
//       },
//     });

//     return NextResponse.json(bill);
//   } catch (error: any) {
//     console.error("Error creating bill:", error);
//     return NextResponse.json({ message: "Failed to create bill", error: error.message }, { status: 500 });
//   }
// }







// // File: src/app/api/billing/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// interface ProductInput {
//   productId: string;
//   quantity: number;
//   price: number;
//   discount?: number;
//   gst?: number;
//   total: number;
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       userClerkId,
//       customerId,
//       products,
//       total,
//       discount,
//       gst,
//       grandTotal,
//       paymentMode,
//       paymentStatus,
//       notes,
//       dueDate,
//       companyName,
//       companyAddress,
//       companyPhone,
//       contactPerson,
//       logoUrl,
//       signatureUrl,
//       websiteUrl,
//     } = body;

//     if (!userClerkId || !products?.length) {
//       return NextResponse.json(
//         { message: "Missing required fields or products" },
//         { status: 400 }
//       );
//     }

//     const dbUser = await prisma.user.findUnique({
//       where: { clerkId: userClerkId },
//     });
//     if (!dbUser) {
//       return NextResponse.json({ message: "Invalid user" }, { status: 400 });
//     }

//     // Only keep products that actually exist
//     const validItems = await prisma.item.findMany({
//       where: { id: { in: products.map((p: ProductInput) => p.productId) } },
//     });
//     const validProductIds = validItems.map((i) => i.id);
//     const validProducts = (products as ProductInput[]).filter((p) =>
//       validProductIds.includes(p.productId)
//     );

//     if (!validProducts.length) {
//       return NextResponse.json(
//         { message: "No valid products provided" },
//         { status: 400 }
//       );
//     }

//     const bill = await prisma.bill.create({
//       data: {
//         userId: dbUser.id,
//         customerId: customerId || undefined,
//         total,
//         discount,
//         gst,
//         grandTotal,
//         paymentMode,
//         paymentStatus,
//         notes,
//         dueDate: dueDate ? new Date(dueDate) : undefined,

//         // Optional company fields
//         companyName: companyName || undefined,
//         companyAddress: companyAddress || undefined,
//         companyPhone: companyPhone || undefined,
//         contactPerson: contactPerson || undefined,
//         logoUrl: logoUrl || undefined,
//         signatureUrl: signatureUrl || undefined,
//         websiteUrl: websiteUrl || undefined,

//         products: {
//           create: validProducts.map((p) => ({
//             productId: p.productId,
//             quantity: p.quantity,
//             price: p.price,
//             discount: p.discount,
//             gst: p.gst,
//             total: p.total,
//           })),
//         },

//         history: {
//           create: {
//             snapshot: {
//               products: validProducts,
//               total,
//               discount,
//               gst,
//               grandTotal,
//               paymentMode,
//               paymentStatus,
//               notes,
//               dueDate,
//               companyName,
//               companyAddress,
//               companyPhone,
//               contactPerson,
//               logoUrl,
//               signatureUrl,
//               websiteUrl,
//             },
//           },
//         },
//       },
//       include: {
//         // ✅ remove `product: true` to avoid null errors
//         products: true,
//         customer: true,
//         payments: true,
//         history: true,
//       },
//     });

//     return NextResponse.json(bill);
//   } catch (error: any) {
//     console.error("Error creating bill:", error);
//     return NextResponse.json(
//       { message: "Failed to create bill", error: error.message },
//       { status: 500 }
//     );
//   }
// }





































//run build












// // File: src/app/api/billing/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { Prisma } from "@prisma/client";

// interface ProductInput {
//   productId: string;
//   quantity: number;
//   price: number;
//   discount?: number;
//   gst?: number;
//   total: number;
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       userClerkId,
//       customerId,
//       products,
//       total,
//       discount,
//       gst,
//       grandTotal,
//       paymentMode,
//       paymentStatus,
//       notes,
//       dueDate,
//       companyName,
//       companyAddress,
//       companyPhone,
//       contactPerson,
//       logoUrl,
//       signatureUrl,
//       websiteUrl,
//     } = body;

//     if (!userClerkId || !products?.length) {
//       return NextResponse.json(
//         { message: "Missing required fields or products" },
//         { status: 400 }
//       );
//     }

//     // ✅ Find the user from Clerk ID
//     const dbUser = await prisma.user.findUnique({
//       where: { clerkId: userClerkId },
//     });

//     if (!dbUser) {
//       return NextResponse.json({ message: "Invalid user" }, { status: 400 });
//     }

//     // ✅ Fetch only valid products from DB
//     const validItems = await prisma.item.findMany({
//       where: { id: { in: products.map((p: ProductInput) => p.productId) } },
//     });

//     const validProductIds = validItems.map((i) => i.id);

//     const validProducts = (products as ProductInput[]).filter((p) =>
//       validProductIds.includes(p.productId)
//     );

//     if (!validProducts.length) {
//       return NextResponse.json(
//         { message: "No valid products provided" },
//         { status: 400 }
//       );
//     }

//     // ✅ Properly balanced JSON.stringify / JSON.parse
//     const snapshot: Prisma.InputJsonValue = JSON.parse(
//       JSON.stringify({
//         products: validProducts.map((p) => ({
//           productId: p.productId,
//           quantity: p.quantity,
//           price: p.price,
//           discount: p.discount,
//           gst: p.gst,
//           total: p.total,
//         })),
//         total,
//         discount,
//         gst,
//         grandTotal,
//         paymentMode,
//         paymentStatus,
//         notes,
//         dueDate,
//         companyName,
//         companyAddress,
//         companyPhone,
//         contactPerson,
//         logoUrl,
//         signatureUrl,
//         websiteUrl,
//       })
//     ); // ✅ ← correctly closed now!

//     // ✅ Create bill with related products & snapshot history
//     const bill = await prisma.bill.create({
//       data: {
//         userId: dbUser.id,
//         customerId: customerId || undefined,
//         total,
//         discount,
//         gst,
//         grandTotal,
//         paymentMode,
//         paymentStatus,
//         notes,
//         dueDate: dueDate ? new Date(dueDate) : undefined,

//         // Company / Branding fields
//         companyName: companyName || undefined,
//         companyAddress: companyAddress || undefined,
//         companyPhone: companyPhone || undefined,
//         contactPerson: contactPerson || undefined,
//         logoUrl: logoUrl || undefined,
//         signatureUrl: signatureUrl || undefined,
//         websiteUrl: websiteUrl || undefined,

//         // Product list creation
//         products: {
//           create: validProducts.map((p) => ({
//             productId: p.productId,
//             quantity: p.quantity,
//             price: p.price,
//             discount: p.discount,
//             gst: p.gst,
//             total: p.total,
//           })),
//         },

//         // History record with JSON snapshot
//         history: {
//           create: {
//             snapshot,
//           },
//         },
//       },
//       include: {
//         products: true,
//         customer: true,
//         payments: true,
//         history: true,
//       },
//     });

//     return NextResponse.json(bill);
//   } catch (error: any) {
//     console.error("Error creating bill:", error);
//     return NextResponse.json(
//       { message: "Failed to create bill", error: error.message },
//       { status: 500 }
//     );
//   }
// }




// File: src/app/api/billing/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ProductInput {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  gst?: number;
  total: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userClerkId,
      customerId,
      products,
      total,
      discount,
      gst,
      grandTotal,
      paymentMode,
      paymentStatus,
      notes,
      dueDate,
      companyName,
      companyAddress,
      companyPhone,
      contactPerson,
      logoUrl,
      signatureUrl,
      websiteUrl,
    } = body;

    if (!userClerkId || !products?.length) {
      return NextResponse.json(
        { message: "Missing required fields or products" },
        { status: 400 }
      );
    }

    // ✅ Find the user from Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
    });

    if (!dbUser) {
      return NextResponse.json({ message: "Invalid user" }, { status: 400 });
    }

    // ✅ Fetch valid items from DB
    const validItems = await prisma.item.findMany({
      where: { id: { in: products.map((p: ProductInput) => p.productId) } },
    });

    const validProductIds = validItems.map((i) => i.id);

    const validProducts = (products as ProductInput[]).filter((p) =>
      validProductIds.includes(p.productId)
    );

    if (!validProducts.length) {
      return NextResponse.json(
        { message: "No valid products provided" },
        { status: 400 }
      );
    }

    // ✅ Snapshot with product names
    const snapshot: Prisma.InputJsonValue = JSON.parse(
      JSON.stringify({
        products: validProducts.map((p) => {
          const item = validItems.find((i) => i.id === p.productId);
          return {
            productId: p.productId,
            productName: item?.name || "Unnamed Item",
            quantity: p.quantity,
            price: p.price,
            discount: p.discount,
            gst: p.gst,
            total: p.total,
          };
        }),
        total,
        discount,
        gst,
        grandTotal,
        paymentMode,
        paymentStatus,
        notes,
        dueDate,
        companyName,
        companyAddress,
        companyPhone,
        contactPerson,
        logoUrl,
        signatureUrl,
        websiteUrl,
      })
    );

    // ✅ Create bill with product names
    const bill = await prisma.bill.create({
      data: {
        userId: dbUser.id,
        customerId: customerId || undefined,
        total,
        discount,
        gst,
        grandTotal,
        paymentMode,
        paymentStatus,
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,

        companyName: companyName || undefined,
        companyAddress: companyAddress || undefined,
        companyPhone: companyPhone || undefined,
        contactPerson: contactPerson || undefined,
        logoUrl: logoUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        websiteUrl: websiteUrl || undefined,

        // ✅ Include product names
        products: {
          create: validProducts.map((p) => {
            const item = validItems.find((i) => i.id === p.productId);
            return {
              productId: p.productId,
              productName: item?.name || "Unnamed Item",
              quantity: p.quantity,
              price: p.price,
              discount: p.discount,
              gst: p.gst,
              total: p.total,
            };
          }),
        },

        // History record
        history: {
          create: {
            snapshot,
          },
        },
      },
      include: {
        products: true,
        customer: true,
        payments: true,
        history: true,
      },
    });

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { message: "Failed to create bill", error: error.message },
      { status: 500 }
    );
  }
}












