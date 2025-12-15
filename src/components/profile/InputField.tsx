// "use client";

// interface InputProps {
//   type?: string;
//   placeholder: string;
//   value: string;
//   onChange: (value: string) => void;
//   label?: string;
// }

// export default function InputField({
//   type = "text",
//   placeholder,
//   value,
//   onChange,
//   label,
// }: InputProps) {
//   return (
//     <div className="flex flex-col space-y-2 bg-white p-4 rounded-xl shadow-sm">
//       {label && (
//         <label className="text-sm font-semibold text-gray-800">
//           {label}
//         </label>
//       )}
//       <input
//         type={type}
//         placeholder={placeholder}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
//       />
//     </div>
//   );
// }





// src/components/profile/InputField.tsx
"use client";
import React from "react";

type Props = {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
};

export default function InputField({ label, name, value, placeholder = "", onChange, type = "text", required = false }: Props) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
    </label>
  );
}
