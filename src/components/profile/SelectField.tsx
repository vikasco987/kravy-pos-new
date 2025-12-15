// "use client";

// interface SelectFieldProps {
//   label?: string;
//   value: string;
//   onChange: (value: string) => void;
// }

// export default function SelectField({ label, value, onChange }: SelectFieldProps) {
//   return (
//     <div className="flex flex-col space-y-2 bg-white p-4 rounded-xl shadow-sm">
//       {label && (
//         <label className="text-sm font-semibold text-gray-800">
//           {label}
//         </label>
//       )}
//       <select
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
//       >
//         <option value="">Select Business Type</option>
//         <option value="food">🍴 Food / Restaurant / Hotel</option>
//         <option value="retail">🛍️ Retail / Shop</option>
//         <option value="service">⚙️ Service</option>
//         <option value="wholesale">📦 Wholesale</option>
//         <option value="manufacturing">🏭 Manufacturing</option>
//         <option value="other">➕ Other</option>
//       </select>
//     </div>
//   );
// }













// src/components/profile/SelectField.tsx
"use client";
import React from "react";

type Option = { value: string; label: string };

type Props = {
  label: string;
  name: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  required?: boolean;
};

export default function SelectField({ label, name, value, options, onChange, required = false }: Props) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
      >
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
