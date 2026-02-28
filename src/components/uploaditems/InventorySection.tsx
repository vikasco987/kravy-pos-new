



"use client";

import ExpandableSection from "./ExpandableSection";

interface InventorySectionProps {
  openSection: string | null;
  toggleSection: (s: string) => void;
  formData: {
    openingStock: string;
    currentStock: string;
    reorderLevel: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InventorySection({
  openSection,
  toggleSection,
  formData,
  handleChange,
}: InventorySectionProps) {
  return (
    <ExpandableSection
      title="Inventory Details (Optional)"
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
        placeholder="Current Stock"
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
    </ExpandableSection>
  );
}
