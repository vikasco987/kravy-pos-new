// // scripts/fix-db.ts
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   // Set target clerk id here or via env FIX_CLERK_ID
//   const targetClerkId = process.env.FIX_CLERK_ID || "user_36EsI8gKyUZ3b5SvrGL6lDuJ1sN";
//   const adminEmail = process.env.FIX_ADMIN_EMAIL || "ram.magicscale@gmail.com";

//   console.log("🔧 DB FIX START");
//   console.log("Target clerkId:", targetClerkId);
//   console.log("Admin email (used to find user):", adminEmail);

//   // 1) Find user by clerkId or by email
//   let user = await prisma.user.findFirst({
//     where: {
//       OR: [
//         { clerkId: targetClerkId },
//         { email: adminEmail },
//       ],
//     },
//     take: 1,
//   });

//   if (!user) {
//     console.log("⚠ No user found with clerkId or admin email. Will create a user if none exists.");
//     // Try to create user but only if email not taken (rare path). We attempt safe create:
//     try {
//       user = await prisma.user.create({
//         data: {
//           clerkId: targetClerkId,
//           email: adminEmail,
//           name: "Admin",
//           role: "SELLER",
//         },
//       });
//       console.log("✅ Created new user:", user.id);
//     } catch (e: any) {
//       console.error("❌ Could not create user:", e.message || e);
//       console.log("Please inspect DB manually and re-run with FIX_CLERK_ID set.");
//       return;
//     }
//   } else {
//     console.log("✅ Found user:", {
//       id: user.id,
//       email: user.email,
//       clerkId: user.clerkId,
//     });

//     // If user exists but clerkId missing or different, update it to targetClerkId
//     if (!user.clerkId || user.clerkId !== targetClerkId) {
//       // But check if targetClerkId belongs to another user
//       const conflict = await prisma.user.findFirst({
//         where: { clerkId: targetClerkId },
//       });
//       if (conflict && conflict.id !== user.id) {
//         console.warn("⚠ Another user already has the target clerkId:", conflict.id);
//         console.warn("Will NOT overwrite other user's clerkId automatically. Abort.");
//         console.warn("If you want to reassign records to the target clerkId, set FIX_FORCE=true and re-run.");
//         return;
//       }

//       // safe update
//       await prisma.user.update({
//         where: { id: user.id },
//         data: { clerkId: targetClerkId },
//       });
//       console.log("✅ Updated existing user with clerkId:", targetClerkId);
//     } else {
//       console.log("ℹ User already has the target clerkId. No change needed.");
//     }
//   }

//   // 2) Update Category.clerkId (if field exists)
//   try {
//     const resCat = await prisma.category.updateMany({
//       where: {},
//       data: { clerkId: targetClerkId },
//     });
//     console.log(`✅ category.updateMany matched ${resCat.count} documents`);
//   } catch (e) {
//     console.warn("⚠ Skipping categories update (maybe model differs) -", (e as any).message || e);
//   }

//   // 3) Update Item.clerkId
//   try {
//     const resItem = await prisma.item.updateMany({
//       where: {},
//       data: { clerkId: targetClerkId },
//     });
//     console.log(`✅ item.updateMany matched ${resItem.count} documents`);
//   } catch (e) {
//     console.warn("⚠ Skipping items update -", (e as any).message || e);
//   }

//   // 4) Update Bill.clerkId
//   try {
//     const resBill = await prisma.bill.updateMany({
//       where: {},
//       data: { clerkId: targetClerkId },
//     });
//     console.log(`✅ bill.updateMany matched ${resBill.count} documents`);
//   } catch (e) {
//     console.warn("⚠ Skipping bills update -", (e as any).message || e);
//   }

//   // 5) Update Party.createdBy (or clerkId) — adapt depending on your model
//   try {
//     // Try createdBy first
//     const resParty1 = await prisma.party.updateMany({
//       where: {},
//       data: { createdBy: targetClerkId },
//     });
//     console.log(`✅ party.updateMany (createdBy) matched ${resParty1.count} documents`);
//   } catch (e1) {
//     try {
//       const resParty2 = await prisma.party.updateMany({
//         where: {},
//         data: { clerkId: targetClerkId },
//       });
//       console.log(`✅ party.updateMany (clerkId) matched ${resParty2.count} documents`);
//     } catch (e2) {
//       console.warn("⚠ Skipping parties update -", (e2 as any).message || e2);
//     }
//   }

//   // 6) Update BusinessSettings.clerkId (create if missing)
//   try {
//     const bs = await prisma.businessSettings.findFirst({
//       where: { clerkId: targetClerkId },
//     });
//     if (!bs) {
//       await prisma.businessSettings.create({
//         data: {
//           clerkId: targetClerkId,
//           businessName: "My Business",
//           tagline: "",
//         },
//       });
//       console.log("✅ Created default BusinessSettings for clerkId");
//     } else {
//       console.log("ℹ BusinessSettings already exists for clerkId");
//     }
//   } catch (e) {
//     console.warn("⚠ Skipping businessSettings step -", (e as any).message || e);
//   }

//   // 7) Optionally reassign items that have null clerkId to the userId field (user._id) if your schema uses userId
//   try {
//     if (user && (user.id || user.clerkId)) {
//       // If your Item has userId reference, uncomment and adapt below:
//       // await prisma.item.updateMany({ where: { userId: null }, data: { userId: user.id } });
//     }
//   } catch (e) {
//     // ignore
//   }

//   console.log("🎉 DB FIX FINISHED. Review logs above and restart the app if required.");
// }

// main()
//   .catch((err) => {
//     console.error("Fatal error:", err);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// lsst working code in src/app/layout.tsx-----------------------------------------------------------------------

// scripts/fix-db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetClerkId =
    process.env.FIX_CLERK_ID || "user_36EsI8gKyUZ3b5SvrGL6lDuJ1sN";
  const adminEmail =
    process.env.FIX_ADMIN_EMAIL || "ram.magicscale@gmail.com";

  console.log("🔧 DB FIX START");
  console.log("Target clerkId:", targetClerkId);

  // 1) Find or create user
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ clerkId: targetClerkId }, { email: adminEmail }],
    },
  });

  if (!user) {
    console.log("⚠ No user found. Creating...");
    user = await prisma.user.create({
      data: {
        clerkId: targetClerkId,
        email: adminEmail,
        name: "Admin",
        role: "SELLER",
      },
    });
  }

  console.log("✅ Using user:", user);

  // ============================
  // 2) CATEGORY UPDATE (has clerkId)
  // ============================
  try {
    const res = await prisma.category.updateMany({
      data: { clerkId: targetClerkId },
    });
    console.log(`✅ Updated Category.clerkId (${res.count} records)`);
  } catch (e) {
    console.warn("⚠ Failed updating Category:", e);
  }

  // ============================
  // 3) ITEM UPDATE (has clerkId)
  // ============================
  try {
    const res = await prisma.item.updateMany({
      data: { clerkId: targetClerkId },
    });
    console.log(`✅ Updated Item.clerkId (${res.count} items)`);
  } catch (e) {
    console.warn("⚠ Failed updating Item:", e);
  }

  // ============================
  // 4) BILL UPDATE — FIELD = clerkUserId
  // ============================
  try {
    const res = await prisma.bill.updateMany({
      data: { clerkUserId: targetClerkId },
    });
    console.log(`✅ Updated Bill.clerkUserId (${res.count} bills)`);
  } catch (e) {
    console.warn("⚠ Failed updating Bill:", e);
  }

  // ============================
  // 5) PARTY UPDATE — FIELD = createdBy
  // ============================
  try {
    const res = await prisma.party.updateMany({
      data: { createdBy: targetClerkId },
    });
    console.log(`✅ Updated Party.createdBy (${res.count} parties)`);
  } catch (e) {
    console.warn("⚠ Failed updating Party:", e);
  }

  // ============================
  // 6) PURCHASE UPDATE — FIELD = userId refers to User.clerkId
  // ============================
  try {
    // const res = await prisma.purchase.updateMany({
    //   data: { userId: targetClerkId },
    // });
    // console.log(`✅ Updated Purchase.userId (${res.count} purchases)`);
  } catch (e) {
    console.warn("⚠ Failed updating Purchases:", e);
  }

  console.log("🎉 DB FIX COMPLETED SUCCESSFULLY");
}

main()
  .catch((err) => {
    console.error("❌ Fatal error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
