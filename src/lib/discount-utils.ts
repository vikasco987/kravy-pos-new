/**
 * Logic to calculate discount based on type and cart state
 */

export type DiscountType = "PERCENTAGE" | "FLAT" | "BOGO" | "ITEM_WISE";

export interface DiscountOffer {
  id: string;
  code: string;
  discountType: string;
  discountValue?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  buyItemId?: string;
  buyQty?: number;
  getItemOffId?: string;
  getQty?: number;
  applyOnCategory?: string;
}

export function calculateDiscount(offer: DiscountOffer, subtotal: number, items: any[]): number {
  if (offer.minOrderValue && subtotal < offer.minOrderValue) {
    return 0; // Doesn't meet minimum order requirement
  }

  let discountAmt = 0;

  switch (offer.discountType) {
    case "FLAT":
      discountAmt = offer.discountValue || 0;
      break;

    case "PERCENTAGE":
      discountAmt = (subtotal * (offer.discountValue || 0)) / 100;
      if (offer.maxDiscount && discountAmt > offer.maxDiscount) {
        discountAmt = offer.maxDiscount;
      }
      break;

    case "BOGO":
      // Check if buy item and get item are in cart
      const buyItem = items.find(i => i.id === offer.buyItemId);
      if (buyItem && buyItem.qty >= (offer.buyQty || 1)) {
        // Find the get item to see its price (we give it for free)
        const getItem = items.find(i => i.id === offer.getItemOffId);
        if (getItem) {
          // Discount = (Price of Get Item) * (Off Qty)
          // Simple logic: one set of BOGO per bill for now
          discountAmt = getItem.rate * (offer.getQty || 1);
        }
      }
      break;

    case "ITEM_WISE":
      // Discount only on items in a specific category or specific item
      items.forEach(i => {
        if (i.id === offer.buyItemId || (offer.applyOnCategory && i.category?.name === offer.applyOnCategory)) {
          const itemDiscount = (i.rate * i.qty * (offer.discountValue || 0)) / 100;
          discountAmt += itemDiscount;
        }
      });
      break;
  }

  return Number(discountAmt.toFixed(2));
}
