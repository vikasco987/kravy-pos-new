import prisma from "./prisma";

/**
 * Deducts raw materials based on the recipes of items in an order.
 * @param orderItems List of items in the order
 */
export async function deductInventory(orderItems: any[]) {
  try {
    for (const item of orderItems) {
      // Find the recipe for this item
      // Note: We need to find by name or ID. Usually Item ID is better if stored in Order.
      // In this app, order.items is a JSON array. We need to match with Item model.
      
      // Let's assume orderItem has an 'id' (the Item's DB id)
      const itemId = item.id;
      const quantitySold = item.qty || item.quantity || 1;

      if (!itemId) continue;

      const recipeItems = await prisma.recipeItem.findMany({
        where: { itemId },
      });

      for (const recipe of recipeItems) {
        const amountToDeduct = recipe.quantity * quantitySold;

        await prisma.rawMaterial.update({
          where: { id: recipe.materialId },
          data: {
            stock: {
              decrement: amountToDeduct
            }
          }
        });
        
        console.log(`[INVENTORY] Deducted ${amountToDeduct} from material ${recipe.materialId} for item ${itemId}`);
      }
    }
  } catch (error) {
    console.error("[INVENTORY_DEDUCTION_ERROR]:", error);
  }
}
