



"use client";

import ExpandableSection from "./ExpandableSection";

interface GstTaxSectionProps {
  openSection: string | null;
  toggleSection: (s: string) => void;
  formData: {
    gst: string;
    otherTax: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function GstTaxSection({
  openSection,
  toggleSection,
  formData,
  handleChange,
}: GstTaxSectionProps) {
  return (
    <ExpandableSection
      title="GST and Tax (Optional)"
      section="gst"
      openSection={openSection}
      toggleSection={toggleSection}
    >
      <input
        type="number"
        name="gst"
        placeholder="GST %"
        value={formData.gst}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
      <input
        type="number"
        name="otherTax"
        placeholder="Other Tax %"
        value={formData.otherTax}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
      />
    </ExpandableSection>
  );
}












