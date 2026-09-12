import prisma from "./prisma";

/**
 * Executes a Prisma transaction with explicit retry logic for transient MongoDB/Prisma transaction conflicts.
 * Retries on P2034 (WriteConflict) and P2028 (Transaction API error) up to maxRetries.
 */
export async function withTransactionRetry<T>(
  operation: (tx: any) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await prisma.$transaction(operation, {
        maxWait: 5000,
        timeout: 15000,
      });
    } catch (error: any) {
      if (error.code === "P2034") {
        attempt++;
        if (attempt >= maxRetries) {
          console.error(`[TX_RETRY] Failed after ${maxRetries} attempts due to ${error.code}`);
          throw error;
        }
        console.warn(`[TX_RETRY] Transaction conflict ${error.code}. Retrying attempt ${attempt + 1}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt)); // Exponential backoff
      } else {
        throw error; // Throw non-retryable errors immediately
      }
    }
  }
  throw new Error("Transaction retry loop exhausted without returning or throwing. This should be unreachable.");
}

/**
 * Executes the inventory deduction logic using an existing transaction client.
 * This allows callers to bundle locks and deductions into a single ACID transaction.
 */
export async function executeInventoryDeduction(tx: any, orderItems: any[]) {
  if (!orderItems || orderItems.length === 0) return;

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

    // 2. Execute using the provided transaction client
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
        }
      }
      }
