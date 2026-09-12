import prisma from "./prisma";

/**
 * Deducts raw materials based on the recipes of items in an order.
 * @param orderItems List of items in the order
 */
export async function deductInventory(orderItems: any[]) {
  if (!orderItems || orderItems.length === 0) return;
  const tStart = Date.now();

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

      const updatePromises: Promise<any>[] = [];

      // 2c. Update raw materials bulk (with clamping to 0)
      if (materialDeductions.size > 0) {
        const materialIds = Array.from(materialDeductions.keys());
        const materials = await tx.rawMaterial.findMany({
          where: { id: { in: materialIds } }
        });

        for (const material of materials) {
          const deduction = materialDeductions.get(material.id) || 0;
          const newStock = Math.max(0, (material.stock || 0) - deduction);
          
          updatePromises.push(
            tx.rawMaterial.update({
              where: { id: material.id },
              data: { stock: newStock }
            })
          );
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
          
          updatePromises.push(
            tx.item.update({
              where: { id: currentItem.id },
              data: { currentStock: newStock }
            })
          );
        }
      }

      // Execute all writes in parallel inside the transaction
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

    }, {
      maxWait: 5000, 
      timeout: 10000, // Reduced from 60000 since it should be fast now
    });
    
  } catch (err) {
    console.error("[INVENTORY_PERF] CRITICAL ERROR in deductInventory:", err);
    throw err; // Propagate error so caller can reset idempotency claim
  }
}
