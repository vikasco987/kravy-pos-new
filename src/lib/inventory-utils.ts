import prisma from "./prisma";

/**
 * Deducts raw materials based on the recipes of items in an order.
 * @param orderItems List of items in the order
 */
export async function deductInventory(orderItems: any[]) {
  console.log(`[INVENTORY_DEBUG] Starting deduction for ${orderItems.length} items.`);

  if (!orderItems || orderItems.length === 0) return;

  try {
    // 1. Aggregate requested quantities for each finished item
    const itemDeductions = new Map<string, number>();
    
    for (const item of orderItems) {
      const rawItemId = item.itemId || item.id;
      const itemId = rawItemId ? rawItemId.split('-')[0] : null;
      const quantitySold = Number(item.qty || item.quantity || 1);
      
      if (!itemId || isNaN(quantitySold) || quantitySold <= 0) continue;
      
      itemDeductions.set(itemId, (itemDeductions.get(itemId) || 0) + quantitySold);
    }

    if (itemDeductions.size === 0) {
      console.log("[INVENTORY_DEBUG] No valid items to deduct.");
      return;
    }

    const itemIds = Array.from(itemDeductions.keys());

    // 2. Execute within transaction
    await prisma.$transaction(async (tx) => {
      // 2a. Fetch all required recipes at once
      const recipeItems = await tx.recipeItem.findMany({
        where: { itemId: { in: itemIds } }
      });

      // 2b. Calculate total raw material deductions across the entire order
      const materialDeductions = new Map<string, number>();
      
      for (const ri of recipeItems) {
        const soldQty = itemDeductions.get(ri.itemId) || 0;
        const totalDeduction = ri.quantity * soldQty;
        materialDeductions.set(ri.materialId, (materialDeductions.get(ri.materialId) || 0) + totalDeduction);
      }

      // 2c. Update raw materials bulk (with clamping to 0)
      if (materialDeductions.size > 0) {
        const materialIds = Array.from(materialDeductions.keys());
        const materials = await tx.rawMaterial.findMany({
          where: { id: { in: materialIds } }
        });

        for (const material of materials) {
          const deduction = materialDeductions.get(material.id) || 0;
          const newStock = Math.max(0, (material.stock || 0) - deduction);
          
          await tx.rawMaterial.update({
            where: { id: material.id },
            data: { stock: newStock }
          });
          console.log(`[INVENTORY_DEBUG] Success: New stock for ${material.name} is ${newStock}`);
        }
      }

      // 2d. Update finished items bulk (with clamping to 0)
      const finishedItems = await tx.item.findMany({
        where: { id: { in: itemIds } }
      });

      for (const currentItem of finishedItems) {
        const deduction = itemDeductions.get(currentItem.id) || 0;
        if (currentItem.currentStock !== null && currentItem.currentStock !== undefined) {
          const newStock = Math.max(0, currentItem.currentStock - deduction);
          
          await tx.item.update({
            where: { id: currentItem.id },
            data: { currentStock: newStock }
          });
          console.log(`[INVENTORY_DEBUG] Success: New stock for Finished Item ${currentItem.name} is ${newStock}`);
        }
      }
    }, {
      maxWait: 5000, // default: 2000
      timeout: 60000, // default: 5000
    });
    console.log("[INVENTORY_DEBUG] Inventory deduction cycle completed atomically.");
  } catch (err) {
    console.error("[INVENTORY_DEBUG] CRITICAL ERROR in deductInventory:", err);
  }
}
