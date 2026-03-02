
"use client";

import ExpandableSection from "./ExpandableSection";

interface ProductDetailsSectionProps {
  openSection: string | null;
  toggleSection: (s: string) => void;
  formData: {
    brand: string;
    model: string;
    size: string;
    color: string;
    description: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function ProductDetailsSection({
  openSection,
  toggleSection,
  formData,
  handleChange,
}: ProductDetailsSectionProps) {
  return (
    <ExpandableSection
      title="Product Details (Optional)"
      section="details"
      openSection={openSection}
      toggleSection={toggleSection}
    >
      <input
        type="text"
        name="brand"
        placeholder="Brand"
        value={formData.brand}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <input
        type="text"
        name="model"
        placeholder="Model"
        value={formData.model}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <input
        type="text"
        name="size"
        placeholder="Size"
        value={formData.size}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <input
        type="text"
        name="color"
        placeholder="Color"
        value={formData.color}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
    </ExpandableSection>
  );
}
