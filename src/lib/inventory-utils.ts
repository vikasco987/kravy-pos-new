import prisma from "./prisma";

/**
 * Deducts raw materials based on the recipes of items in an order.
 * @param orderItems List of items in the order
 */
export async function deductInventory(orderItems: any[]) {
  console.log(`[INVENTORY_DEBUG] Starting deduction for ${orderItems.length} items.`);
  
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const itemId = item.itemId || item.id;
        const quantitySold = Number(item.qty || item.quantity || 1);
        const itemName = item.name || "Unknown Item";

        console.log(`[INVENTORY_DEBUG] Processing: ${itemName} (ID: ${itemId}), Qty: ${quantitySold}`);

        if (!itemId || isNaN(quantitySold) || quantitySold <= 0) {
          console.warn(`[INVENTORY_DEBUG] Skipping ${itemName} - Invalid ID or Quantity.`);
          continue;
        }

        const recipeItems = await tx.recipeItem.findMany({
          where: { itemId },
          include: { material: true }
        });

        if (recipeItems.length === 0) {
          console.warn(`[INVENTORY_DEBUG] No recipe found for ${itemName} (ID: ${itemId}). Skipping raw materials deduction.`);
        } else {
          console.log(`[INVENTORY_DEBUG] Found recipe with ${recipeItems.length} ingredients for ${itemName}.`);

          for (const ri of recipeItems) {
            const totalDeduction = ri.quantity * quantitySold;
            
            const currentMaterial = await tx.rawMaterial.findUnique({ where: { id: ri.materialId } });
            if (currentMaterial) {
              const newStock = Math.max(0, (currentMaterial.stock || 0) - totalDeduction);
              await tx.rawMaterial.update({
                where: { id: ri.materialId },
                data: { stock: newStock },
              });
              console.log(`[INVENTORY_DEBUG] Success: New stock for ${currentMaterial.name} is ${newStock}`);
            }
          }
        }

        // ✅ ALSO DEDUCT FINISHED ITEM STOCK (The item itself) atomically preventing negatives
        const currentItem = await tx.item.findUnique({ where: { id: itemId } });
        if (currentItem && currentItem.currentStock !== null && currentItem.currentStock !== undefined) {
          const newStock = Math.max(0, currentItem.currentStock - quantitySold);
          await tx.item.update({
            where: { id: itemId },
            data: { currentStock: newStock }
          });
          console.log(`[INVENTORY_DEBUG] Success: New stock for Finished Item ${currentItem.name} is ${newStock}`);
        }
      }
    });
    console.log("[INVENTORY_DEBUG] Inventory deduction cycle completed atomically.");
  } catch (err) {
    console.error("[INVENTORY_DEBUG] CRITICAL ERROR in deductInventory:", err);
  }
}
