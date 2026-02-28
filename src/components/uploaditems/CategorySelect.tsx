

// File: src/components/uploaditems/CategorySelect.tsx
"use client";

import React from "react";

// ✅ Category type
export interface Category {
  id: string;
  name: string;
}

// ✅ Props for CategorySelect
interface CategorySelectProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  setCategories?: React.Dispatch<React.SetStateAction<Category[]>>; // optional if you update categories dynamically
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <div className="mb-4">
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
      >
        <option value="">Select Category *</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategorySelect;
