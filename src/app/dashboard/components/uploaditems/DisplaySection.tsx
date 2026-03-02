



"use client";

import ExpandableSection from "./ExpandableSection";

interface DisplaySectionProps {
  openSection: string | null;
  toggleSection: (s: string) => void;
  formData: {
    displayCategory: string;
    displayColor: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DisplaySection({
  openSection,
  toggleSection,
  formData,
  handleChange,
}: DisplaySectionProps) {
  return (
    <ExpandableSection
      title="Product Display (Optional)"
      section="display"
      openSection={openSection}
      toggleSection={toggleSection}
    >
      <input
        type="text"
        name="displayCategory"
        placeholder="Display Category"
        value={formData.displayCategory}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <input
        type="color"
        name="displayColor"
        value={formData.displayColor}
        onChange={handleChange}
        className="w-16 h-12 border rounded-lg cursor-pointer"
      />
    </ExpandableSection>
  );
}
