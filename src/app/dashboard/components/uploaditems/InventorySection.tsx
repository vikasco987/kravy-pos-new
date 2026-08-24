



"use client";

import ExpandableSection from "./ExpandableSection";

interface InventorySectionProps {
  openSection: string | null;
  toggleSection: (s: string) => void;
  formData: {
    openingStock: string;
    currentStock: string;
    reorderLevel: string;
    expiryDate?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showExpiry?: boolean;
  isStockCompulsory?: boolean;
}

export default function InventorySection({
  openSection,
  toggleSection,
  formData,
  handleChange,
  showExpiry,
  isStockCompulsory,
}: InventorySectionProps) {
  return (
    <ExpandableSection
      title={`Inventory Details ${isStockCompulsory ? "(Required)" : "(Optional)"}`}
      section="inventory"
      openSection={openSection}
      toggleSection={toggleSection}
    >
      <input
        type="number"
        name="openingStock"
        placeholder="Opening Stock"
        value={formData.openingStock}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <input
        type="number"
        name="currentStock"
        placeholder={isStockCompulsory ? "Current Stock *" : "Current Stock"}
        required={isStockCompulsory}
        value={formData.currentStock}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <input
        type="number"
        name="reorderLevel"
        placeholder="Reorder Level"
        value={formData.reorderLevel}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      {showExpiry && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium ml-1">Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate || ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
          />
        </div>
      )}
    </ExpandableSection>
  );
}
