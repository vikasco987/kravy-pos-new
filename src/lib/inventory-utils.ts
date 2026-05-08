import prisma from "./prisma";

/**
 * Deducts raw materials based on the recipes of items in an order.
 * @param orderItems List of items in the order
 */
export async function deductInventory(orderItems: any[]) {
  console.log(`[INVENTORY_DEBUG] Starting deduction for ${orderItems.length} items.`);
  
  try {
    for (const item of orderItems) {
      const itemId = item.itemId || item.id;
      const quantitySold = item.qty || item.quantity || 1;
      const itemName = item.name || "Unknown Item";

      console.log(`[INVENTORY_DEBUG] Processing: ${itemName} (ID: ${itemId}), Qty: ${quantitySold}`);

      if (!itemId) {
        console.warn(`[INVENTORY_DEBUG] Skipping ${itemName} - No valid ID found.`);
        continue;
      }

      const recipeItems = await prisma.recipeItem.findMany({
        where: { itemId },
        include: { material: true }
      });

      if (recipeItems.length === 0) {
        console.warn(`[INVENTORY_DEBUG] No recipe found for ${itemName} (ID: ${itemId}). Deduction skipped.`);
        continue;
      }

      console.log(`[INVENTORY_DEBUG] Found recipe with ${recipeItems.length} ingredients for ${itemName}.`);

      for (const ri of recipeItems) {
        const totalDeduction = ri.quantity * quantitySold;
        console.log(`[INVENTORY_DEBUG] Deducting ${totalDeduction} ${ri.material?.unit || ''} of ${ri.material?.name || ri.materialId} for ${itemName}`);
        
        try {
          const updated = await prisma.rawMaterial.update({
            where: { id: ri.materialId },
            data: { stock: { decrement: totalDeduction } },
          });
          console.log(`[INVENTORY_DEBUG] Success: New stock for ${updated.name} is ${updated.stock}`);
        } catch (updateErr) {
          console.error(`[INVENTORY_DEBUG] Failed to update material ${ri.materialId}:`, updateErr);
        }
      }

      // ✅ ALSO DEDUCT FINISHED ITEM STOCK (The item itself)
      try {
        const updatedItem = await prisma.item.update({
          where: { id: itemId },
          data: { currentStock: { decrement: Number(quantitySold) } }
        });
        console.log(`[INVENTORY_DEBUG] Success: New stock for Finished Item ${updatedItem.name} is ${updatedItem.currentStock}`);
      } catch (itemErr) {
        console.warn(`[INVENTORY_DEBUG] Failed to update Item stock (might not exist in Item model):`, itemErr);
      }
    }
    console.log("[INVENTORY_DEBUG] Inventory deduction cycle completed.");
  } catch (err) {
    console.error("[INVENTORY_DEBUG] CRITICAL ERROR in deductInventory:", err);
  }
}
