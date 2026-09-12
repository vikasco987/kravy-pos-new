import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log("Starting Concurrency Tests for Inventory System...");
  
  // Create a dummy user/clerk
  const testUserId = "test_user_" + Date.now();
  const user = await prisma.user.create({
    data: { clerkId: testUserId, email: testUserId + "@test.com", name: "Test User" }
  });

  // Create some raw materials and finished items
  const rawMaterial = await prisma.rawMaterial.create({
    data: { name: "Test Raw Material", stock: 100, unit: "kg", user: { connect: { clerkId: testUserId } } }
  });
  
  const finishedItem = await prisma.item.create({
    data: { name: "Test Burger", currentStock: 10, sellingPrice: 100, clerkId: testUserId, user: { connect: { id: user.id } }, category: { create: { name: "Test Category", clerkId: testUserId } } }
  });

  await prisma.recipeItem.create({
    data: { itemId: finishedItem.id, materialId: rawMaterial.id, quantity: 2 }
  });

  console.log("Test Data Setup Complete.");
  console.log(`Initial Stock - Raw: 100, Finished: 10`);

  // --- Test 1: Order + Order Concurrency (Same Order PATCHed twice simultaneously) ---
  console.log("\n--- Test 1: Order + Order Concurrency ---");
  const order1 = await prisma.order.create({
    data: {
      user: { connect: { clerkId: testUserId } },
      total: 100,
      status: "PENDING",
      items: [{ id: finishedItem.id, qty: 1 }],
      inventoryDeducted: false
    }
  });

  // Simulate two concurrent PATCH /api/orders setting it to COMPLETED
  const { withTransactionRetry, executeInventoryDeduction } = await import('./src/lib/inventory-utils');

  const patchLogic = async (orderId: string, processName: string) => {
    try {
      await withTransactionRetry(async (tx: any) => {
        const claim = await tx.order.updateMany({
          where: { id: orderId, inventoryDeducted: false },
          data: { inventoryDeducted: true }
        });
        if (claim.count > 0) {
          console.log(`[${processName}] Won claim. Deducting inventory...`);
          await executeInventoryDeduction(tx, [{ id: finishedItem.id, qty: 1 }]);
        } else {
          console.log(`[${processName}] Lost claim. Skipping deduction.`);
        }
      });
    } catch (e: any) {
       console.log(`[${processName}] Failed: ${e.message}`);
    }
  };

  await Promise.all([
    patchLogic(order1.id, "Process A"),
    patchLogic(order1.id, "Process B")
  ]);

  const afterOrder1_Raw = await prisma.rawMaterial.findUnique({ where: { id: rawMaterial.id } });
  const afterOrder1_Item = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  console.log(`Resulting Stock - Raw: ${afterOrder1_Raw?.stock} (Expected 98), Finished: ${afterOrder1_Item?.currentStock} (Expected 9)`);

  // --- Test 2: Order + BillManager Concurrency ---
  console.log("\n--- Test 2: Order + BillManager Concurrency ---");
  const order2 = await prisma.order.create({
    data: {
      user: { connect: { clerkId: testUserId } },
      total: 100,
      status: "PENDING",
      items: [{ id: finishedItem.id, qty: 1 }],
      inventoryDeducted: false
    }
  });

  // BillManager POST logic
  const billPostLogic = async (orderId: string, processName: string) => {
    try {
      const bill = await prisma.billManager.create({
         data: {
            user: { connect: { clerkId: testUserId } },
            billNumber: "TEST-BILL-" + Date.now(),
            items: [{ id: finishedItem.id, qty: 2 }], // Bill has 2 burgers, Order had 1
            subtotal: 200, tax: 0, total: 200, paymentMode: "Cash", paymentStatus: "Paid", inventoryDeducted: false
         }
      });

      await withTransactionRetry(async (tx: any) => {
          const orderLock = await tx.order.findUnique({ where: { id: orderId } });
          let itemsToDeduct = [{ id: finishedItem.id, qty: 2 }] as any[];

          if (orderLock?.inventoryDeducted) {
             const difference = 2 - 1; // Simulated deduction of extra qty
             itemsToDeduct = [{ id: finishedItem.id, qty: difference }];
             console.log(`[${processName}] Order already deducted. Deducting difference: ${difference}`);
          } else {
             await tx.order.update({
                 where: { id: orderId },
                 data: { inventoryDeducted: true }
             });
             console.log(`[${processName}] Won order lock. Deducting full amount: 2`);
          }

          await tx.billManager.update({
             where: { id: bill.id },
             data: { inventoryDeducted: true }
          });
          await executeInventoryDeduction(tx, itemsToDeduct);
      });
    } catch (e: any) {
        console.log(`[${processName}] Failed: ${e.message}`);
    }
  };

  await Promise.all([
    patchLogic(order2.id, "Order PATCH Process"),
    billPostLogic(order2.id, "Bill POST Process")
  ]);

  const afterOrder2_Raw = await prisma.rawMaterial.findUnique({ where: { id: rawMaterial.id } });
  const afterOrder2_Item = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  
  if (afterOrder2_Raw?.stock !== 94) throw new Error(`Assertion Failed! Raw Stock: ${afterOrder2_Raw?.stock}, Expected: 94`);
  if (afterOrder2_Item?.currentStock !== 7) throw new Error(`Assertion Failed! Finished Stock: ${afterOrder2_Item?.currentStock}, Expected: 7`);
  console.log(`[PASS] Order + Bill Concurrency (Order wins): Assertions Passed! Raw: 94, Item: 7`);

  // --- Test 3: BillManager wins -> Order retries ---
  console.log("\n--- Test 3: BillManager wins, Order retries ---");
  const order3 = await prisma.order.create({
    data: {
      user: { connect: { clerkId: testUserId } },
      total: 100,
      status: "PENDING",
      items: [{ id: finishedItem.id, qty: 1 }],
      inventoryDeducted: false
    }
  });

  // Since we want Bill to win, we'll introduce an artificial delay in the Order's claim so Bill grabs the lock first.
  const patchLogicDelayed = async (orderId: string, processName: string) => {
    try {
      await withTransactionRetry(async (tx: any) => {
        // Delay order claim to ensure Bill gets it
        await new Promise(res => setTimeout(res, 500));
        
        const claim = await tx.order.updateMany({
          where: { id: orderId, inventoryDeducted: false },
          data: { inventoryDeducted: true }
        });
        if (claim.count > 0) {
          console.log(`[${processName}] Won claim. Deducting inventory...`);
          await executeInventoryDeduction(tx, [{ id: finishedItem.id, qty: 1 }]);
        } else {
          console.log(`[${processName}] Lost claim. Order already deducted by Bill. Skipping deduction.`);
        }
      });
    } catch (e: any) {
       console.log(`[${processName}] Failed: ${e.message}`);
    }
  };

  await Promise.all([
    patchLogicDelayed(order3.id, "Order PATCH Process (Delayed)"),
    billPostLogic(order3.id, "Bill POST Process (Fast)")
  ]);

  const afterOrder3_Raw = await prisma.rawMaterial.findUnique({ where: { id: rawMaterial.id } });
  const afterOrder3_Item = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  
  if (afterOrder3_Raw?.stock !== 90) throw new Error(`Assertion Failed! Raw Stock: ${afterOrder3_Raw?.stock}, Expected: 90`);
  if (afterOrder3_Item?.currentStock !== 5) throw new Error(`Assertion Failed! Finished Stock: ${afterOrder3_Item?.currentStock}, Expected: 5`);
  console.log(`[PASS] Order + Bill Concurrency (Bill wins): Assertions Passed! Raw: 90, Item: 5`);
  // Previous Raw=94, Item=7. Total 2 burgers ordered => -4 raw, -2 item => Raw=90, Item=5.

  // --- Test 4: Bill + Bill Concurrency ---
  console.log("\n--- Test 4: Bill + Bill Concurrency ---");
  const billConcurrencyOrder = await prisma.order.create({
    data: {
      user: { connect: { clerkId: testUserId } },
      total: 100,
      status: "PENDING",
      items: [{ id: finishedItem.id, qty: 1 }],
      inventoryDeducted: false
    }
  });

  const billLogic = async (processName: string) => {
    try {
      const bill = await prisma.billManager.create({
         data: {
            user: { connect: { clerkId: testUserId } },
            billNumber: "TEST-BILL-" + Date.now(),
            items: [{ id: finishedItem.id, qty: 2 }],
            subtotal: 200, tax: 0, total: 200, paymentMode: "Cash", paymentStatus: "Paid", inventoryDeducted: false
         }
      });
      await withTransactionRetry(async (tx: any) => {
          const claim = await tx.billManager.updateMany({
              where: { id: bill.id, inventoryDeducted: false },
              data: { inventoryDeducted: true }
          });
          if (claim.count > 0) {
              console.log(`[${processName}] Won claim on Bill. Deducting...`);
              await executeInventoryDeduction(tx, [{ id: finishedItem.id, qty: 2 }]);
          } else {
              console.log(`[${processName}] Lost claim on Bill.`);
          }
      });
    } catch (e: any) {
        console.log(`[${processName}] Failed: ${e.message}`);
    }
  };

  await Promise.all([
    billLogic("Bill Process A"),
    billLogic("Bill Process B")
  ]);

  const afterOrder4_Raw = await prisma.rawMaterial.findUnique({ where: { id: rawMaterial.id } });
  const afterOrder4_Item = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  console.log(`Resulting Stock - Raw: ${afterOrder4_Raw?.stock} (Expected 82), Finished: ${afterOrder4_Item?.currentStock} (Expected 1)`);
  // Previous Raw=90, Item=5. We ran 2 Bill processes. Each process creates a DIFFERENT Bill! 
  // Wait, Bill+Bill concurrency means two different bills are processed? Yes, they don't share the same Bill ID.
  // So both should succeed and deduct 2 each = 4 total items.
  // 4 items => -8 raw. Raw = 90 - 8 = 82. Item = 5 - 4 = 1.

  // --- Test 5: Failed Transaction Rollback ---
  console.log("\n--- Test 5: Failed Transaction Rollback ---");
  const rollbackOrder = await prisma.order.create({
    data: {
      user: { connect: { clerkId: testUserId } },
      total: 100,
      status: "PENDING",
      items: [{ id: finishedItem.id, qty: 1 }],
      inventoryDeducted: false
    }
  });

  const beforeRollbackItem = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  const beforeRollbackRaw = await prisma.rawMaterial.findUnique({ where: { id: rawMaterial.id } });
  
  console.log(`[Rollback Test] Stock BEFORE transaction - Finished: ${beforeRollbackItem?.currentStock}, Raw: ${beforeRollbackRaw?.stock}`);

  try {
      await withTransactionRetry(async (tx: any) => {
          const claim = await tx.order.updateMany({
              where: { id: rollbackOrder.id, inventoryDeducted: false },
              data: { inventoryDeducted: true }
          });
          if (claim.count > 0) {
              console.log("[Rollback Test] Won claim. Intentionally throwing error before deduction...");
              throw new Error("Simulated Deduction Failure");
          }
      });
  } catch (e: any) {
      console.log(`[Rollback Test] Caught error: ${e.message}`);
  }

  const checkRollback = await prisma.order.findUnique({ where: { id: rollbackOrder.id } });
  const afterRollbackItem = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  const afterRollbackRaw = await prisma.rawMaterial.findUnique({ where: { id: rawMaterial.id } });

  console.log(`[Rollback Test] Order inventoryDeducted flag is: ${checkRollback?.inventoryDeducted}`);
  console.log(`[Rollback Test] Stock AFTER failure - Finished: ${afterRollbackItem?.currentStock}`);
  console.log(`[Rollback Test] Stock AFTER failure - Raw: ${afterRollbackRaw?.stock}`);

  if (checkRollback?.inventoryDeducted !== false) throw new Error("Assertion Failed: inventoryDeducted should be false!");
  if (afterRollbackItem?.currentStock !== beforeRollbackItem?.currentStock) throw new Error("Assertion Failed: Item stock changed during rollback!");
  if (afterRollbackRaw?.stock !== beforeRollbackRaw?.stock) throw new Error("Assertion Failed: Raw stock changed during rollback!");
  console.log(`[PASS] Rollback preserves DB state perfectly.`);

  console.log("\n[Rollback Test] Now running a successful retry...");
  await patchLogic(rollbackOrder.id, "Successful Retry Process");
  
  const finalRetryItem = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  const finalRetryRaw = await prisma.rawMaterial.findUnique({ where: { id: rawMaterial.id } });
  
  if (finalRetryItem?.currentStock !== (beforeRollbackItem?.currentStock ?? 0) - 1) throw new Error("Assertion Failed: Retry did not correctly deduct the stock!");
  console.log(`[PASS] Retry deduction succeeded correctly.`);


  // --- Test 6: Repeated COMPLETED Request ---
  console.log("\n--- Test 6: Repeated COMPLETED Request ---");
  await patchLogic(rollbackOrder.id, "Repeat COMPLETED - 1st Call");
  await patchLogic(rollbackOrder.id, "Repeat COMPLETED - 2nd Call");
  
  const afterOrder6_Item = await prisma.item.findUnique({ where: { id: finishedItem.id } });
  console.log(`[Repeat Test] Stock after 2 calls - Finished: ${afterOrder6_Item?.currentStock} (Expected 0)`);
  // Started at 1, deduct 1 => 0. Second call skips.

  console.log("\nTests Complete.");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
