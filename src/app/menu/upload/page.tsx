// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Upload } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         {/* Header */}
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         {/* Image Upload */}
//         <motion.div
//           whileHover={{ scale: 1.03 }}
//           whileTap={{ scale: 0.97 }}
//           className="mb-6 flex justify-center"
//         >
//           <label
//             htmlFor="fileUpload"
//             className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition"
//           >
//             <input
//               type="file"
//               accept="image/*"
//               className="hidden"
//               id="fileUpload"
//               onChange={(e) => setImage(e.target.files?.[0] || null)}
//             />
//             {image ? (
//               <span className="text-xs text-gray-700 font-medium text-center p-2">
//                 {image.name}
//               </span>
//             ) : (
//               <>
//                 <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                 <span className="text-sm text-purple-700 font-semibold">
//                   Upload Image
//                 </span>
//               </>
//             )}
//           </label>
//         </motion.div>

//         {/* Product/Service Name */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Product/Service Name *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//         </div>

//         {/* Sell Price + Item Unit */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <input
//             type="number"
//             placeholder="Sell Price *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//           <select className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800">
//             <option>Item Unit</option>
//             <option>Piece</option>
//             <option>Kg</option>
//             <option>Litre</option>
//             <option>Pack</option>
//           </select>
//         </div>

//         {/* Category */}
//         <div className="mb-4">
//           <select className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800">
//             <option>Select Item Category</option>
//             <option>Food</option>
//             <option>Drinks</option>
//             <option>Snacks</option>
//             <option>Services</option>
//           </select>
//         </div>

//         {/* MRP + Purchase Price */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <input
//             type="number"
//             placeholder="MRP"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//           <input
//             type="number"
//             placeholder="Purchase Price"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//         </div>

//         {/* Optional Sections */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="space-y-3 mb-6"
//         >
//           {[
//             "GST and Tax (Optional)",
//             "Product Details (Optional)",
//             "Inventory Details (Optional)",
//             "Product Display (Optional)",
//           ].map((label, idx) => (
//             <motion.button
//               key={idx}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               className="w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               {label}
//             </motion.button>
//           ))}
//         </motion.div>

//         {/* Save Button */}
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//         >
//           SAVE
//         </motion.button>
//       </motion.div>
//     </div>
//   );
// }












// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Upload } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         {/* Header */}
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         {/* Image Upload */}
//         <motion.div
//           whileHover={{ scale: 1.03 }}
//           whileTap={{ scale: 0.97 }}
//           className="mb-6 flex justify-center"
//         >
//           <label
//             htmlFor="fileUpload"
//             className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition"
//           >
//             <input
//               type="file"
//               accept="image/*"
//               className="hidden"
//               id="fileUpload"
//               onChange={(e) => setImage(e.target.files?.[0] || null)}
//             />
//             {image ? (
//               <span className="text-xs text-gray-700 font-medium text-center p-2">
//                 {image.name}
//               </span>
//             ) : (
//               <>
//                 <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                 <span className="text-sm text-purple-700 font-semibold">
//                   Upload Image
//                 </span>
//               </>
//             )}
//           </label>
//         </motion.div>

//         {/* Product/Service Name */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Product/Service Name *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//         </div>

//         {/* Sell Price + Item Unit */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <input
//             type="number"
//             placeholder="Sell Price *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//           <select className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800">
//             <option>Item Unit</option>
//             <option>Piece</option>
//             <option>Kg</option>
//             <option>Litre</option>
//             <option>Pack</option>
//           </select>
//         </div>

//         {/* Category */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Enter Item Category *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//         </div>

//         {/* MRP + Purchase Price */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <input
//             type="number"
//             placeholder="MRP"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//           <input
//             type="number"
//             placeholder="Purchase Price"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//         </div>

//         {/* Optional Sections */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="space-y-3 mb-6"
//         >
//           {[
//             "GST and Tax (Optional)",
//             "Product Details (Optional)",
//             "Inventory Details (Optional)",
//             "Product Display (Optional)",
//           ].map((label, idx) => (
//             <motion.button
//               key={idx}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               className="w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               {label}
//             </motion.button>
//           ))}
//         </motion.div>

//         {/* Save Button */}
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//         >
//           SAVE
//         </motion.button>
//       </motion.div>
//     </div>
//   );
// }














// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Upload } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [isDragging, setIsDragging] = useState(false);

//   const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setImage(e.dataTransfer.files[0]);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         {/* Header */}
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         {/* Image Upload with Drag & Drop */}
//         <motion.div
//           whileHover={{ scale: 1.03 }}
//           whileTap={{ scale: 0.97 }}
//           className="mb-6 flex justify-center"
//         >
//           <label
//             htmlFor="fileUpload"
//             onDragOver={(e) => {
//               e.preventDefault();
//               setIsDragging(true);
//             }}
//             onDragLeave={() => setIsDragging(false)}
//             onDrop={handleDrop}
//             className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
//               isDragging
//                 ? "border-purple-500 bg-purple-100"
//                 : "border-purple-300 bg-purple-50 hover:bg-purple-100"
//             }`}
//           >
//             <input
//               type="file"
//               accept="image/*"
//               className="hidden"
//               id="fileUpload"
//               onChange={(e) => setImage(e.target.files?.[0] || null)}
//             />
//             {image ? (
//               <span className="text-xs text-gray-700 font-medium text-center p-2">
//                 {image.name}
//               </span>
//             ) : (
//               <>
//                 <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                 <span className="text-sm text-purple-700 font-semibold">
//                   Drag & Drop or Click
//                 </span>
//               </>
//             )}
//           </label>
//         </motion.div>

//         {/* Product/Service Name */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Product/Service Name *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//         </div>

//         {/* Sell Price + Item Unit */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <input
//             type="number"
//             placeholder="Sell Price *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//           <select className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800">
//             <option>Item Unit</option>
//             <option>Piece</option>
//             <option>Kg</option>
//             <option>Litre</option>
//             <option>Pack</option>
//           </select>
//         </div>

//         {/* Category */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Enter Item Category *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//         </div>

//         {/* MRP + Purchase Price */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <input
//             type="number"
//             placeholder="MRP"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//           <input
//             type="number"
//             placeholder="Purchase Price"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//         </div>

//         {/* Optional Sections */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="space-y-3 mb-6"
//         >
//           {[
//             "GST and Tax (Optional)",
//             "Product Details (Optional)",
//             "Inventory Details (Optional)",
//             "Product Display (Optional)",
//           ].map((label, idx) => (
//             <motion.button
//               key={idx}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               className="w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               {label}
//             </motion.button>
//           ))}
//         </motion.div>

//         {/* Save Button */}
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//         >
//           SAVE
//         </motion.button>
//       </motion.div>
//     </div>
//   );
// }
















// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Upload, ChevronDown, ChevronUp } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [openSection, setOpenSection] = useState<string | null>(null);

//   const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setImage(e.dataTransfer.files[0]);
//     }
//   };

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         {/* Header */}
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         {/* Image Upload with Drag & Drop */}
//         <motion.div
//           whileHover={{ scale: 1.03 }}
//           whileTap={{ scale: 0.97 }}
//           className="mb-6 flex justify-center"
//         >
//           <label
//             htmlFor="fileUpload"
//             onDragOver={(e) => {
//               e.preventDefault();
//               setIsDragging(true);
//             }}
//             onDragLeave={() => setIsDragging(false)}
//             onDrop={handleDrop}
//             className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
//               isDragging
//                 ? "border-purple-500 bg-purple-100"
//                 : "border-purple-300 bg-purple-50 hover:bg-purple-100"
//             }`}
//           >
//             <input
//               type="file"
//               accept="image/*"
//               className="hidden"
//               id="fileUpload"
//               onChange={(e) => setImage(e.target.files?.[0] || null)}
//             />
//             {image ? (
//               <span className="text-xs text-gray-700 font-medium text-center p-2">
//                 {image.name}
//               </span>
//             ) : (
//               <>
//                 <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                 <span className="text-sm text-purple-700 font-semibold">
//                   Drag & Drop or Click
//                 </span>
//               </>
//             )}
//           </label>
//         </motion.div>

//         {/* Product/Service Name */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Product/Service Name *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//         </div>

//         {/* Sell Price + Item Unit */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <input
//             type="number"
//             placeholder="Sell Price *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//           <select className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800">
//             <option>Item Unit</option>
//             <option>Piece</option>
//             <option>Kg</option>
//             <option>Litre</option>
//             <option>Pack</option>
//           </select>
//         </div>

//         {/* Category */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Enter Item Category *"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//             required
//           />
//         </div>

//         {/* MRP + Purchase Price */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <input
//             type="number"
//             placeholder="MRP"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//           <input
//             type="number"
//             placeholder="Purchase Price"
//             className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 text-gray-800"
//           />
//         </div>

//         {/* Expandable Optional Sections */}
//         <div className="space-y-4 mb-6">
//           {/* GST Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("gst")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               GST and Tax (Optional)
//               {openSection === "gst" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "gst" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="number"
//                   placeholder="GST %"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//                 <input
//                   type="number"
//                   placeholder="Other Tax %"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Product Details Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("details")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Product Details (Optional)
//               {openSection === "details" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "details" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Brand"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Model/Size/Color"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//                 <textarea
//                   placeholder="Description"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Inventory Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("inventory")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Inventory Details (Optional)
//               {openSection === "inventory" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "inventory" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="number"
//                   placeholder="Opening Stock"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//                 <input
//                   type="number"
//                   placeholder="Reorder Level"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Product Display Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("display")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Product Display (Optional)
//               {openSection === "display" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "display" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Display Category"
//                   className="w-full border rounded-lg px-4 py-2"
//                 />
//                 <input
//                   type="color"
//                   className="w-full border rounded-lg px-4 py-2 h-12"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Save Button */}
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//         >
//           SAVE
//         </motion.button>
//       </motion.div>
//     </div>
//   );
// }















// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Upload, ChevronDown, ChevronUp } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [openSection, setOpenSection] = useState<string | null>(null);

//   const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setImage(e.dataTransfer.files[0]);
//     }
//   };

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         {/* Header */}
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         {/* Image Upload with Drag & Drop */}
//         <motion.div
//           whileHover={{ scale: 1.03 }}
//           whileTap={{ scale: 0.97 }}
//           className="mb-6 flex justify-center"
//         >
//           <label
//             htmlFor="fileUpload"
//             onDragOver={(e) => {
//               e.preventDefault();
//               setIsDragging(true);
//             }}
//             onDragLeave={() => setIsDragging(false)}
//             onDrop={handleDrop}
//             className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
//               isDragging
//                 ? "border-purple-500 bg-purple-100"
//                 : "border-purple-300 bg-purple-50 hover:bg-purple-100"
//             }`}
//           >
//             <input
//               type="file"
//               accept="image/*"
//               className="hidden"
//               id="fileUpload"
//               onChange={(e) => setImage(e.target.files?.[0] || null)}
//             />
//             {image ? (
//               <span className="text-xs text-gray-800 font-medium text-center p-2">
//                 {image.name}
//               </span>
//             ) : (
//               <>
//                 <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                 <span className="text-sm text-purple-700 font-semibold">
//                   Drag & Drop or Click
//                 </span>
//               </>
//             )}
//           </label>
//         </motion.div>

//         {/* Product/Service Name */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Product/Service Name *"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             required
//           />
//         </div>

//         {/* Sell Price + Item Unit */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <input
//             type="number"
//             placeholder="Sell Price *"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             required
//           />
//           <select className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50">
//             <option value="">Item Unit</option>
//             <option>Piece</option>
//             <option>Kg</option>
//             <option>Litre</option>
//             <option>Pack</option>
//           </select>
//         </div>

//         {/* Category */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Enter Item Category *"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             required
//           />
//         </div>

//         {/* MRP + Purchase Price */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <input
//             type="number"
//             placeholder="MRP"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//           />
//           <input
//             type="number"
//             placeholder="Purchase Price"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//           />
//         </div>

//         {/* Expandable Optional Sections */}
//         <div className="space-y-4 mb-6">
//           {/* GST Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("gst")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               GST and Tax (Optional)
//               {openSection === "gst" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "gst" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="number"
//                   placeholder="GST %"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="number"
//                   placeholder="Other Tax %"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Product Details Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("details")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Product Details (Optional)
//               {openSection === "details" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "details" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Brand"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Model/Size/Color"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <textarea
//                   placeholder="Description"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Inventory Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("inventory")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Inventory Details (Optional)
//               {openSection === "inventory" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "inventory" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="number"
//                   placeholder="Opening Stock"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="number"
//                   placeholder="Reorder Level"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Product Display Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("display")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Product Display (Optional)
//               {openSection === "display" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "display" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Display Category"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="color"
//                   className="w-full border rounded-lg px-4 py-2 h-12"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Save Button */}
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//         >
//           SAVE
//         </motion.button>
//       </motion.div>
//     </div>
//   );
// }















// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Upload, ChevronDown, ChevronUp } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [openSection, setOpenSection] = useState<string | null>(null);

//   const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setImage(e.dataTransfer.files[0]);
//     }
//   };

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         {/* Header */}
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         {/* Image Upload with Drag & Drop */}
//         <motion.div
//           whileHover={{ scale: 1.03 }}
//           whileTap={{ scale: 0.97 }}
//           className="mb-6 flex justify-center"
//         >
//           <label
//             htmlFor="fileUpload"
//             onDragOver={(e) => {
//               e.preventDefault();
//               setIsDragging(true);
//             }}
//             onDragLeave={() => setIsDragging(false)}
//             onDrop={handleDrop}
//             className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
//               isDragging
//                 ? "border-purple-500 bg-purple-100"
//                 : "border-purple-300 bg-purple-50 hover:bg-purple-100"
//             }`}
//           >
//             <input
//               type="file"
//               accept="image/*"
//               className="hidden"
//               id="fileUpload"
//               onChange={(e) => setImage(e.target.files?.[0] || null)}
//             />
//             {image ? (
//               <span className="text-xs text-gray-800 font-medium text-center p-2">
//                 {image.name}
//               </span>
//             ) : (
//               <>
//                 <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                 <span className="text-sm text-purple-700 font-semibold">
//                   Drag & Drop or Click
//                 </span>
//               </>
//             )}
//           </label>
//         </motion.div>

//         {/* Product/Service Name */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Product/Service Name *"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             required
//           />
//         </div>

//         {/* Sell Price + Item Unit */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <input
//             type="number"
//             placeholder="Sell Price *"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             required
//           />
//           <select className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50">
//             <option value="">Item Unit</option>
//             <option>Piece</option>
//             <option>Kg</option>
//             <option>Litre</option>
//             <option>Pack</option>
//           </select>
//         </div>

//         {/* Category */}
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Enter Item Category *"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             required
//           />
//         </div>

//         {/* MRP + Purchase Price */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <input
//             type="number"
//             placeholder="MRP"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//           />
//           <input
//             type="number"
//             placeholder="Purchase Price"
//             className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//           />
//         </div>

//         {/* Expandable Optional Sections */}
//         <div className="space-y-4 mb-6">
//           {/* GST Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("gst")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               GST and Tax (Optional)
//               {openSection === "gst" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "gst" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="number"
//                   placeholder="GST %"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="number"
//                   placeholder="Other Tax %"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Product Details Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("details")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Product Details (Optional)
//               {openSection === "details" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "details" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Brand"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Model/Size/Color"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <textarea
//                   placeholder="Description"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Inventory Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("inventory")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Inventory Details (Optional)
//               {openSection === "inventory" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "inventory" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="number"
//                   placeholder="Opening Stock"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="number"
//                   placeholder="Reorder Level"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Product Display Section */}
//           <div>
//             <button
//               type="button"
//               onClick={() => toggleSection("display")}
//               className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//             >
//               Product Display (Optional)
//               {openSection === "display" ? <ChevronUp /> : <ChevronDown />}
//             </button>
//             {openSection === "display" && (
//               <div className="mt-3 space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Display Category"
//                   className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                 />
//                 <input
//                   type="color"
//                   className="w-full border rounded-lg px-4 py-2 h-12"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Save Button */}
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//         >
//           SAVE
//         </motion.button>
//       </motion.div>
//     </div>
//   );
// }














// "use client";
// import { useState, useRef } from "react";
// import { motion } from "framer-motion";
// import { Upload, ChevronDown, ChevronUp } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
  
//   const formRef = useRef<HTMLFormElement>(null);

//   const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setImage(e.dataTransfer.files[0]);
//     }
//   };

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) {
//       setIsSaving(false);
//       return;
//     }

//     let imageUrl = "";
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string);

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );

//         const cloudData = await cloudRes.json();
//         imageUrl = cloudData.secure_url;
//       } catch (error) {
//         console.error("Image upload failed:", error);
//         alert("Image upload failed. Please try again.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     // Collect all form data using the name attribute
//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: (form.elements.namedItem("itemCategory") as HTMLInputElement).value, // 👈 FIXED
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl: imageUrl,
//     };

//     // Send the combined data to your Next.js API route
//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       if (res.ok) {
//         alert("Item saved successfully!");
//         form.reset(); // Clear the form on success
//         setImage(null);
//         setOpenSection(null);
//       } else {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to save item.");
//       }
//     } catch (error) {
//       console.error("Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           {/* Image Upload with Drag & Drop */}
//           <motion.div
//             whileHover={{ scale: 1.03 }}
//             whileTap={{ scale: 0.97 }}
//             className="mb-6 flex justify-center"
//           >
//             <label
//               htmlFor="fileUpload"
//               onDragOver={(e) => {
//                 e.preventDefault();
//                 setIsDragging(true);
//               }}
//               onDragLeave={() => setIsDragging(false)}
//               onDrop={handleDrop}
//               className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
//                 isDragging
//                   ? "border-purple-500 bg-purple-100"
//                   : "border-purple-300 bg-purple-50 hover:bg-purple-100"
//               }`}
//             >
//               <input
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 id="fileUpload"
//                 onChange={(e) => setImage(e.target.files?.[0] || null)}
//               />
//               {image ? (
//                 <span className="text-xs text-gray-800 font-medium text-center p-2">
//                   {image.name}
//                 </span>
//               ) : (
//                 <>
//                   <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                   <span className="text-sm text-purple-700 font-semibold">
//                     Drag & Drop or Click
//                   </span>
//                 </>
//               )}
//             </label>
//           </motion.div>

//           {/* Product/Service Name */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* Sell Price + Item Unit */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* Category */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="itemCategory"
//               placeholder="Enter Item Category *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* MRP + Purchase Price */}
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input
//               type="number"
//               name="mrp"
//               placeholder="MRP"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//             <input
//               type="number"
//               name="purchasePrice"
//               placeholder="Purchase Price"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//           </div>

//           {/* Expandable Optional Sections */}
//           <div className="space-y-4 mb-6">
//             {/* GST Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("gst")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 GST and Tax (Optional)
//                 {openSection === "gst" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "gst" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="number"
//                     name="gst"
//                     placeholder="GST %"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="number"
//                     name="otherTax"
//                     placeholder="Other Tax %"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Product Details Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("details")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 Product Details (Optional)
//                 {openSection === "details" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "details" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="text"
//                     name="brand"
//                     placeholder="Brand"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="text"
//                     name="model"
//                     placeholder="Model/Size/Color"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <textarea
//                     name="description"
//                     placeholder="Description"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Inventory Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("inventory")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 Inventory Details (Optional)
//                 {openSection === "inventory" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "inventory" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="number"
//                     name="openingStock"
//                     placeholder="Opening Stock"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="number"
//                     name="reorderLevel"
//                     placeholder="Reorder Level"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Product Display Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("display")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 Product Display (Optional)
//                 {openSection === "display" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "display" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="text"
//                     name="displayCategory"
//                     placeholder="Display Category"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="color"
//                     name="displayColor"
//                     className="w-full border rounded-lg px-4 py-2 h-12"
//                   />
//                 </div>
//               )}
//             </div>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }














// "use client";
// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import { Upload, ChevronDown, ChevronUp } from "lucide-react";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) {
//           setCategories(data);
//         } else {
//           console.error("Failed to fetch categories:", data.message);
//         }
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setImage(e.dataTransfer.files[0]);
//     }
//   };

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) {
//       setIsSaving(false);
//       return;
//     }

//     let imageUrl = "";
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string);

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );

//         const cloudData = await cloudRes.json();
//         imageUrl = cloudData.secure_url;
//       } catch (error) {
//         console.error("Image upload failed:", error);
//         alert("Image upload failed. Please try again.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     // Collect all form data using the name attribute
//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: (form.elements.namedItem("itemCategory") as HTMLSelectElement).value,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl: imageUrl,
//     };

//     // Send the combined data to your Next.js API route
//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       if (res.ok) {
//         alert("Item saved successfully!");
//         form.reset(); // Clear the form on success
//         setImage(null);
//         setOpenSection(null);
//       } else {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to save item.");
//       }
//     } catch (error) {
//       console.error("Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           {/* Image Upload with Drag & Drop */}
//           <motion.div
//             whileHover={{ scale: 1.03 }}
//             whileTap={{ scale: 0.97 }}
//             className="mb-6 flex justify-center"
//           >
//             <label
//               htmlFor="fileUpload"
//               onDragOver={(e) => {
//                 e.preventDefault();
//                 setIsDragging(true);
//               }}
//               onDragLeave={() => setIsDragging(false)}
//               onDrop={handleDrop}
//               className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
//                 isDragging
//                   ? "border-purple-500 bg-purple-100"
//                   : "border-purple-300 bg-purple-50 hover:bg-purple-100"
//               }`}
//             >
//               <input
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 id="fileUpload"
//                 onChange={(e) => setImage(e.target.files?.[0] || null)}
//               />
//               {image ? (
//                 <span className="text-xs text-gray-800 font-medium text-center p-2">
//                   {image.name}
//                 </span>
//               ) : (
//                 <>
//                   <Upload className="w-8 h-8 text-purple-500 mb-2" />
//                   <span className="text-sm text-purple-700 font-semibold">
//                     Drag & Drop or Click
//                   </span>
//                 </>
//               )}
//             </label>
//           </motion.div>

//           {/* Product/Service Name */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* Sell Price + Item Unit */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* Category Dropdown */}
//           <div className="mb-4">
//             <select
//               name="itemCategory"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             >
//               <option value="">Select Category *</option>
//               {categories.map((cat) => (
//                 <option key={cat.id} value={cat.id}>
//                   {cat.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* MRP + Purchase Price */}
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input
//               type="number"
//               name="mrp"
//               placeholder="MRP"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//             <input
//               type="number"
//               name="purchasePrice"
//               placeholder="Purchase Price"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//           </div>

//           {/* Expandable Optional Sections */}
//           <div className="space-y-4 mb-6">
//             {/* GST Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("gst")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 GST and Tax (Optional)
//                 {openSection === "gst" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "gst" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="number"
//                     name="gst"
//                     placeholder="GST %"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="number"
//                     name="otherTax"
//                     placeholder="Other Tax %"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Product Details Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("details")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 Product Details (Optional)
//                 {openSection === "details" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "details" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="text"
//                     name="brand"
//                     placeholder="Brand"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="text"
//                     name="model"
//                     placeholder="Model/Size/Color"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <textarea
//                     name="description"
//                     placeholder="Description"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Inventory Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("inventory")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 Inventory Details (Optional)
//                 {openSection === "inventory" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "inventory" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="number"
//                     name="openingStock"
//                     placeholder="Opening Stock"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="number"
//                     name="reorderLevel"
//                     placeholder="Reorder Level"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Product Display Section */}
//             <div>
//               <button
//                 type="button"
//                 onClick={() => toggleSection("display")}
//                 className="flex justify-between w-full border border-purple-300 rounded-lg px-4 py-3 text-purple-700 font-medium hover:bg-purple-50 transition bg-gray-50"
//               >
//                 Product Display (Optional)
//                 {openSection === "display" ? <ChevronUp /> : <ChevronDown />}
//               </button>
//               {openSection === "display" && (
//                 <div className="mt-3 space-y-3">
//                   <input
//                     type="text"
//                     name="displayCategory"
//                     placeholder="Display Category"
//                     className="w-full border rounded-lg px-4 py-2 text-gray-800 placeholder-gray-500"
//                   />
//                   <input
//                     type="color"
//                     name="displayColor"
//                     className="w-full border rounded-lg px-4 py-2 h-12"
//                   />
//                 </div>
//               )}
//             </div>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }














// "use client";
// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import { ChevronDown, ChevronUp } from "lucide-react";
// import ImageUpload from "@/components/uploaditems/ImageUpload";


// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import ExpandableSection from "@/components/uploaditems/ExpandableSection";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";


// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) return;

//     let imageUrl = "";
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string);

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );

//         const cloudData = await cloudRes.json();
//         imageUrl = cloudData.secure_url;
//       } catch (error) {
//         console.error("Image upload failed:", error);
//         alert("Image upload failed. Please try again.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: (form.elements.namedItem("itemCategory") as HTMLSelectElement).value,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl,
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       if (res.ok) {
//         alert("Item saved successfully!");
//         form.reset();
//         setImage(null);
//         setOpenSection(null);
//       } else {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to save item.");
//       }
//     } catch (error) {
//       console.error("Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           {/* Product Name */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* Sell Price + Unit */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* Category Dropdown */}
//           <CategorySelect categories={categories} />

//           {/* MRP + Purchase Price */}
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input
//               type="number"
//               name="mrp"
//               placeholder="MRP"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//             <input
//               type="number"
//               name="purchasePrice"
//               placeholder="Purchase Price"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//           </div>

//           {/* Expandable Sections */}
//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }




























// "use client";
// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // ✅ category state
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) return;

//     let imageUrl = "";
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string);

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );

//         const cloudData = await cloudRes.json();
//         imageUrl = cloudData.secure_url;
//       } catch (error) {
//         console.error("Image upload failed:", error);
//         alert("Image upload failed. Please try again.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory, // ✅ comes from state
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl,
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       if (res.ok) {
//         alert("Item saved successfully!");
//         form.reset();
//         setImage(null);
//         setOpenSection(null);
//         setSelectedCategory(""); // reset category
//       } else {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to save item.");
//       }
//     } catch (error) {
//       console.error("Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           {/* Product Name */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* Sell Price + Unit */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* Category Dropdown */}
//           <CategorySelect
//             categories={categories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//             setCategories={setCategories}
//           />

//           {/* MRP + Purchase Price */}
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input
//               type="number"
//               name="mrp"
//               placeholder="MRP"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//             <input
//               type="number"
//               name="purchasePrice"
//               placeholder="Purchase Price"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//           </div>

//           {/* Expandable Sections */}
//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }

















// "use client";
// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function UploadItemPage() {
//   const [image, setImage] = useState<File | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // ✅ Category state
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   // ✅ Load categories on mount
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   // ✅ Save handler
//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) return;

//     let imageUrl = "";
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append(
//           "upload_preset",
//           process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string
//         );

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );

//         const cloudData = await cloudRes.json();
//         console.log("📸 Cloudinary Response:", cloudData);

//         if (cloudRes.ok && cloudData.secure_url) {
//           imageUrl = cloudData.secure_url;
//         } else {
//           throw new Error(
//             cloudData.error?.message || "Cloudinary did not return an image URL"
//           );
//         }
//       } catch (error) {
//         console.error("❌ Image upload failed:", error);
//         alert("Image upload failed. Please check Cloudinary settings.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat(
//         (form.elements.namedItem("sellPrice") as HTMLInputElement).value
//       ),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory, // ✅ from state
//       mrp:
//         parseFloat(
//           (form.elements.namedItem("mrp") as HTMLInputElement)?.value
//         ) || null,
//       purchasePrice:
//         parseFloat(
//           (form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value
//         ) || null,
//       gst:
//         parseFloat(
//           (form.elements.namedItem("gst") as HTMLInputElement)?.value
//         ) || null,
//       otherTax:
//         parseFloat(
//           (form.elements.namedItem("otherTax") as HTMLInputElement)?.value
//         ) || null,
//       brand:
//         (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model:
//         (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description:
//         (form.elements.namedItem("description") as HTMLTextAreaElement)?.value ||
//         null,
//       openingStock:
//         parseInt(
//           (form.elements.namedItem("openingStock") as HTMLInputElement)?.value
//         ) || null,
//       reorderLevel:
//         parseInt(
//           (form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value
//         ) || null,
//       displayCategory:
//         (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value ||
//         null,
//       displayColor:
//         (form.elements.namedItem("displayColor") as HTMLInputElement)?.value ||
//         null,
//       imageUrl,
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       if (res.ok) {
//         alert("✅ Item saved successfully!");
//         form.reset();
//         setImage(null);
//         setOpenSection(null);
//         setSelectedCategory(""); // reset category
//       } else {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to save item.");
//       }
//     } catch (error) {
//       console.error("❌ Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
//           ➕ New Item
//         </h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           {/* Product Name */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* Sell Price + Unit */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* Category Dropdown */}
//           <CategorySelect
//             categories={categories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//             setCategories={setCategories}
//           />

//           {/* MRP + Purchase Price */}
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input
//               type="number"
//               name="mrp"
//               placeholder="MRP"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//             <input
//               type="number"
//               name="purchasePrice"
//               placeholder="Purchase Price"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//           </div>

//           {/* Expandable Sections */}
//           <div className="space-y-4 mb-6">
//             <GstTaxSection
//               openSection={openSection}
//               toggleSection={toggleSection}
//             />
//             <ProductDetailsSection
//               openSection={openSection}
//               toggleSection={toggleSection}
//             />
//             <InventorySection
//               openSection={openSection}
//               toggleSection={toggleSection}
//             />
//             <DisplaySection
//               openSection={openSection}
//               toggleSection={toggleSection}
//             />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }

















// "use client";  // must be the very first line

// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {   // ✅ Use "Page" or any valid component name
//   const [image, setImage] = useState<File | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) return;

//     let imageUrl = "";
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string);

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );

//         const cloudData = await cloudRes.json();
//         imageUrl = cloudData.secure_url || "";
//       } catch (error) {
//         console.error("Image upload failed:", error);
//         alert("Image upload failed. Please try again.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl,
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       if (res.ok) {
//         alert("Item saved successfully!");
//         form.reset();
//         setImage(null);
//         setOpenSection(null);
//         setSelectedCategory("");
//       } else {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to save item.");
//       }
//     } catch (error) {
//       console.error("Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           {/* Product Name */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* Sell Price + Unit */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* Category Dropdown */}
//           <CategorySelect
//             categories={categories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//             setCategories={setCategories}
//           />

//           {/* MRP + Purchase Price */}
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input
//               type="number"
//               name="mrp"
//               placeholder="MRP"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//             <input
//               type="number"
//               name="purchasePrice"
//               placeholder="Purchase Price"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             />
//           </div>

//           {/* Expandable Sections */}
//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }




// "use client";

// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {
//   const [image, setImage] = useState<File | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) return;

//     let imageUrl: string | null = null;

//     // ✅ Upload file to Cloudinary if selected
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string);

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );

//         const cloudData = await cloudRes.json();
//         if (!cloudData.secure_url) throw new Error("Cloudinary returned no URL");
//         imageUrl = cloudData.secure_url;
//       } catch (error) {
//         console.error("Image upload failed:", error);
//         alert("Image upload failed. Please try again.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl, // ✅ Store Cloudinary URL
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save item");

//       alert("Item saved successfully!");
//       form.reset();
//       setImage(null);
//       setOpenSection(null);
//       setSelectedCategory("");
//     } catch (error) {
//       console.error("Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           {/* Product Name */}
//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           {/* Sell Price + Unit */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* Category */}
//           <CategorySelect
//             categories={categories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//             setCategories={setCategories}
//           />

//           {/* MRP + Purchase Price */}
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input type="number" name="mrp" placeholder="MRP" className="..." />
//             <input type="number" name="purchasePrice" placeholder="Purchase Price" className="..." />
//           </div>

//           {/* Expandable Sections */}
//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }



// "use client";

// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {
//   const [image, setImage] = useState<File | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const form = formRef.current;
//     if (!form) return;

//     let imageUrl: string | null = null;

//     // Upload image to Cloudinary (only when submitting form)
//     if (image) {
//       try {
//         const formData = new FormData();
//         formData.append("file", image);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);

//         const cloudRes = await fetch(
//           `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//           { method: "POST", body: formData }
//         );
//         const cloudData = await cloudRes.json();
//         if (!cloudData.secure_url) throw new Error("Cloudinary returned no URL");
//         imageUrl = cloudData.secure_url;
//       } catch (error) {
//         console.error("Image upload failed:", error);
//         alert("Image upload failed. Please try again.");
//         setIsSaving(false);
//         return;
//       }
//     }

//     // Collect all form fields
//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl, // ✅ Save uploaded image URL
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save item");

//       alert("Item saved successfully!");
//       form.reset();
//       setImage(null);
//       setOpenSection(null);
//       setSelectedCategory("");
//     } catch (error) {
//       console.error("Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           <CategorySelect
//             categories={categories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//             setCategories={setCategories}
//           />

//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input type="number" name="mrp" placeholder="MRP" className="w-full border rounded-lg px-4 py-3" />
//             <input type="number" name="purchasePrice" placeholder="Purchase Price" className="w-full border rounded-lg px-4 py-3" />
//           </div>

//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }














// "use client";

// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {
//   // 🔹 image is Cloudinary secure_url string, not File
//   const [image, setImage] = useState<string | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);

//     const form = formRef.current;
//     if (!form) return;

//     // ✅ use image URL directly (already uploaded)
//     if (!image) {
//       alert("Please upload an image before saving.");
//       setIsSaving(false);
//       return;
//     }

//     // Collect all form fields
//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl: image, // ✅ Cloudinary URL from state
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save item");

//       alert("✅ Item saved successfully!");
//       form.reset();
//       setImage(null);
//       setOpenSection(null);
//       setSelectedCategory("");
//     } catch (error) {
//       console.error("❌ Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           {/* 🔹 Upload handles Cloudinary URL */}
//           <ImageUpload image={image} setImage={setImage} />

//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           <CategorySelect
//             categories={categories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//             setCategories={setCategories}
//           />

//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input type="number" name="mrp" placeholder="MRP" className="w-full border rounded-lg px-4 py-3" />
//             <input type="number" name="purchasePrice" placeholder="Purchase Price" className="w-full border rounded-lg px-4 py-3" />
//           </div>

//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }



















// "use client";

// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {
//   // 🔹 image is Cloudinary secure_url string, not File
//   const [image, setImage] = useState<string | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);

//     const form = formRef.current;
//     if (!form) return;

//     // ✅ use image URL directly (already uploaded)
//     if (!image) {
//       alert("Please upload an image before saving.");
//       setIsSaving(false);
//       return;
//     }

//     // Collect all form fields
//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl: image, // ✅ Cloudinary URL from state
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save item");

//       alert("✅ Item saved successfully!");
//       form.reset();
//       setImage(null);
//       setOpenSection(null);
//       setSelectedCategory("");
//     } catch (error) {
//       console.error("❌ Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           {/* 🔹 Upload handles Cloudinary URL */}
//           <ImageUpload image={image} setImage={setImage} />

//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           <CategorySelect
//             categories={categories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//             setCategories={setCategories}
//           />

//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input type="number" name="mrp" placeholder="MRP" className="w-full border rounded-lg px-4 py-3" />
//             <input type="number" name="purchasePrice" placeholder="Purchase Price" className="w-full border rounded-lg px-4 py-3" />
//           </div>

//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }




// "use client";

// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {
//   // 🔹 image is Cloudinary secure_url string, not File
//   const [image, setImage] = useState<string | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);

//     const form = formRef.current;
//     if (!form) return;

//     if (!image) {
//       alert("Please upload an image before saving.");
//       setIsSaving(false);
//       return;
//     }

//     // Collect all form fields
//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl: image,
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save item");

//       alert("✅ Item saved successfully!");
//       form.reset();
//       setImage(null);
//       setOpenSection(null);
//       setSelectedCategory("");
//     } catch (error) {
//       console.error("❌ Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* ✅ Corrected CategorySelect usage */}
//           <CategorySelect
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//           />

//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input type="number" name="mrp" placeholder="MRP" className="w-full border rounded-lg px-4 py-3" />
//             <input type="number" name="purchasePrice" placeholder="Purchase Price" className="w-full border rounded-lg px-4 py-3" />
//           </div>

//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }





// "use client";

// import { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {
//   // 🔹 image is Cloudinary secure_url string, not File
//   const [image, setImage] = useState<string | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // ✅ Lifted category state to page
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   // ✅ Load categories once
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);

//     const form = formRef.current;
//     if (!form) return;

//     if (!image) {
//       alert("Please upload an image before saving.");
//       setIsSaving(false);
//       return;
//     }

//     const itemData = {
//       name: (form.elements.namedItem("productName") as HTMLInputElement).value,
//       price: parseFloat((form.elements.namedItem("sellPrice") as HTMLInputElement).value),
//       itemUnit: (form.elements.namedItem("itemUnit") as HTMLSelectElement).value,
//       categoryId: selectedCategory,
//       mrp: parseFloat((form.elements.namedItem("mrp") as HTMLInputElement)?.value) || null,
//       purchasePrice: parseFloat((form.elements.namedItem("purchasePrice") as HTMLInputElement)?.value) || null,
//       gst: parseFloat((form.elements.namedItem("gst") as HTMLInputElement)?.value) || null,
//       otherTax: parseFloat((form.elements.namedItem("otherTax") as HTMLInputElement)?.value) || null,
//       brand: (form.elements.namedItem("brand") as HTMLInputElement)?.value || null,
//       model: (form.elements.namedItem("model") as HTMLInputElement)?.value || null,
//       description: (form.elements.namedItem("description") as HTMLTextAreaElement)?.value || null,
//       openingStock: parseInt((form.elements.namedItem("openingStock") as HTMLInputElement)?.value) || null,
//       reorderLevel: parseInt((form.elements.namedItem("reorderLevel") as HTMLInputElement)?.value) || null,
//       displayCategory: (form.elements.namedItem("displayCategory") as HTMLInputElement)?.value || null,
//       displayColor: (form.elements.namedItem("displayColor") as HTMLInputElement)?.value || null,
//       imageUrl: image,
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save item");

//       alert("✅ Item saved successfully!");
//       form.reset();
//       setImage(null);
//       setOpenSection(null);
//       setSelectedCategory("");
//     } catch (error) {
//       console.error("❌ Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           {/* ✅ Fixed CategorySelect usage */}
//           <CategorySelect
//             categories={categories}
//             setCategories={setCategories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//           />

//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input type="number" name="mrp" placeholder="MRP" className="w-full border rounded-lg px-4 py-3" />
//             <input type="number" name="purchasePrice" placeholder="Purchase Price" className="w-full border rounded-lg px-4 py-3" />
//           </div>

//           <div className="space-y-4 mb-6">
//             <GstTaxSection openSection={openSection} toggleSection={toggleSection} />
//             <ProductDetailsSection openSection={openSection} toggleSection={toggleSection} />
//             <InventorySection openSection={openSection} toggleSection={toggleSection} />
//             <DisplaySection openSection={openSection} toggleSection={toggleSection} />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }






// "use client";

// import { useState, useRef, useEffect, ChangeEvent } from "react";
// import { motion } from "framer-motion";
// import ImageUpload from "@/components/uploaditems/ImageUpload";
// import CategorySelect from "@/components/uploaditems/CategorySelect";
// import GstTaxSection from "@/components/uploaditems/GstTaxSection";
// import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
// import InventorySection from "@/components/uploaditems/InventorySection";
// import DisplaySection from "@/components/uploaditems/DisplaySection";

// export default function Page() {
//   const [image, setImage] = useState<string | null>(null);
//   const [openSection, setOpenSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string>("");

//   const formRef = useRef<HTMLFormElement>(null);

//   const [formData, setFormData] = useState({
//     productName: "",
//     sellPrice: "",
//     itemUnit: "",
//     mrp: "",
//     purchasePrice: "",
//     gst: "",
//     otherTax: "",
//     brand: "",
//     model: "",
//     description: "",
//     openingStock: "",
//     reorderLevel: "",
//     displayCategory: "",
//     displayColor: "",
//   });

//   // Load categories from API
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await fetch("/api/categories");
//         const data = await res.json();
//         if (res.ok) setCategories(data);
//       } catch (err) {
//         console.error("❌ Failed to load categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);

//     const form = formRef.current;
//     if (!form) return;

//     if (!image) {
//       alert("Please upload an image before saving.");
//       setIsSaving(false);
//       return;
//     }

//     const parseFloatOrNull = (v: string) => {
//       const n = parseFloat(v);
//       return isNaN(n) ? null : n;
//     };
//     const parseIntOrNull = (v: string) => {
//       const n = parseInt(v);
//       return isNaN(n) ? null : n;
//     };

//     const itemData = {
//       name: formData.productName || undefined,
//       price: parseFloatOrNull(formData.sellPrice),
//       unit: formData.itemUnit || null,
//       categoryId: selectedCategory,
//       mrp: parseFloatOrNull(formData.mrp),
//       purchasePrice: parseFloatOrNull(formData.purchasePrice),
//       gst: parseFloatOrNull(formData.gst),
//       otherTax: parseFloatOrNull(formData.otherTax),
//       brand: formData.brand || null,
//       model: formData.model || null,
//       description: formData.description || null,
//       openingStock: parseIntOrNull(formData.openingStock),
//       reorderLevel: parseIntOrNull(formData.reorderLevel),
//       displayCategory: formData.displayCategory || null,
//       displayColor: formData.displayColor || null,
//       imageUrl: image,
//     };

//     try {
//       const res = await fetch("/api/items", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(itemData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save item");

//       alert("✅ Item saved successfully!");
//       form.reset();
//       setFormData({
//         productName: "",
//         sellPrice: "",
//         itemUnit: "",
//         mrp: "",
//         purchasePrice: "",
//         gst: "",
//         otherTax: "",
//         brand: "",
//         model: "",
//         description: "",
//         openingStock: "",
//         reorderLevel: "",
//         displayCategory: "",
//         displayColor: "",
//       });
//       setImage(null);
//       setOpenSection(null);
//       setSelectedCategory("");
//     } catch (error) {
//       console.error("❌ Failed to save item:", error);
//       alert("Failed to save item. Please check the form data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
//       <motion.div
//         className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">➕ New Item</h1>

//         <form onSubmit={handleSave} ref={formRef}>
//           <ImageUpload image={image} setImage={setImage} />

//           <div className="mb-4">
//             <input
//               type="text"
//               name="productName"
//               placeholder="Product/Service Name *"
//               value={formData.productName}
//               onChange={handleChange}
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <input
//               type="number"
//               name="sellPrice"
//               placeholder="Sell Price *"
//               value={formData.sellPrice}
//               onChange={handleChange}
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//               required
//             />
//             <select
//               name="itemUnit"
//               value={formData.itemUnit}
//               onChange={handleChange}
//               className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
//             >
//               <option value="">Item Unit</option>
//               <option>Piece</option>
//               <option>Kg</option>
//               <option>Litre</option>
//               <option>Pack</option>
//             </select>
//           </div>

//           <CategorySelect
//             categories={categories}
//             setCategories={setCategories}
//             selectedCategory={selectedCategory}
//             setSelectedCategory={setSelectedCategory}
//           />

//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <input
//               type="number"
//               name="mrp"
//               placeholder="MRP"
//               value={formData.mrp}
//               onChange={handleChange}
//               className="w-full border rounded-lg px-4 py-3"
//             />
//             <input
//               type="number"
//               name="purchasePrice"
//               placeholder="Purchase Price"
//               value={formData.purchasePrice}
//               onChange={handleChange}
//               className="w-full border rounded-lg px-4 py-3"
//             />
//           </div>

//           <div className="space-y-4 mb-6">
//             <GstTaxSection
//               openSection={openSection}
//               toggleSection={toggleSection}
//               formData={formData}
//               handleChange={handleChange}
//             />
//             <ProductDetailsSection
//               openSection={openSection}
//               toggleSection={toggleSection}
//               formData={formData}
//               handleChange={handleChange}
//             />
//             <InventorySection
//               openSection={openSection}
//               toggleSection={toggleSection}
//               formData={formData}
//               handleChange={handleChange}
//             />
//             <DisplaySection
//               openSection={openSection}
//               toggleSection={toggleSection}
//               formData={formData}
//               handleChange={handleChange}
//             />
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "SAVE"}
//           </motion.button>
//         </form>
//       </motion.div>
//     </div>
//   );
// }









"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion } from "framer-motion";
import ImageUpload from "@/components/uploaditems/ImageUpload";
import CategorySelect from "@/components/uploaditems/CategorySelect";
import GstTaxSection from "@/components/uploaditems/GstTaxSection";
import ProductDetailsSection from "@/components/uploaditems/ProductDetailsSection";
import InventorySection from "@/components/uploaditems/InventorySection";
import DisplaySection from "@/components/uploaditems/DisplaySection";

export default function Page() {
  const [image, setImage] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    productName: "",
    sellPrice: "",
    itemUnit: "",
    mrp: "",
    purchasePrice: "",
    gst: "",
    otherTax: "",
    brand: "",
    model: "",
    size: "",
    color: "",
    description: "",
    openingStock: "",
    currentStock: "",
    reorderLevel: "",
    displayCategory: "",
    displayColor: "",
  });

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (res.ok) setCategories(data);
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formRef.current) return;

    if (!image) {
      alert("Please upload an image before saving.");
      setIsSaving(false);
      return;
    }

    const parseFloatOrNull = (v: string) => {
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };
    const parseIntOrNull = (v: string) => {
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    };

    const itemData = {
      name: formData.productName || undefined,
      price: parseFloatOrNull(formData.sellPrice),
      unit: formData.itemUnit || null,
      categoryId: selectedCategory,
      mrp: parseFloatOrNull(formData.mrp),
      purchasePrice: parseFloatOrNull(formData.purchasePrice),
      gst: parseFloatOrNull(formData.gst),
      otherTax: parseFloatOrNull(formData.otherTax),
      brand: formData.brand || null,
      model: formData.model || null,
      size: formData.size || null,
      color: formData.color || null,
      description: formData.description || null,
      openingStock: parseIntOrNull(formData.openingStock),
      currentStock: parseIntOrNull(formData.currentStock),
      reorderLevel: parseIntOrNull(formData.reorderLevel),
      displayCategory: formData.displayCategory || null,
      displayColor: formData.displayColor || null,
      imageUrl: image,
    };

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save item");

      alert("✅ Item saved successfully!");
      formRef.current.reset();
      setFormData({
        productName: "",
        sellPrice: "",
        itemUnit: "",
        mrp: "",
        purchasePrice: "",
        gst: "",
        otherTax: "",
        brand: "",
        model: "",
        size: "",
        color: "",
        description: "",
        openingStock: "",
        currentStock: "",
        reorderLevel: "",
        displayCategory: "",
        displayColor: "",
      });
      setImage(null);
      setOpenSection(null);
      setSelectedCategory("");
    } catch (error) {
      console.error("❌ Failed to save item:", error);
      alert("Failed to save item. Please check the form data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
          ➕ New Item
        </h1>

        <form onSubmit={handleSave} ref={formRef}>
          <ImageUpload image={image} setImage={setImage} />

          <div className="mb-4">
            <input
              type="text"
              name="productName"
              placeholder="Product/Service Name *"
              value={formData.productName}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              name="sellPrice"
              placeholder="Sell Price *"
              value={formData.sellPrice}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
              required
            />
            <select
              name="itemUnit"
              value={formData.itemUnit}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50"
            >
              <option value="">Item Unit</option>
              <option>Piece</option>
              <option>Kg</option>
              <option>Litre</option>
              <option>Pack</option>
            </select>
          </div>

          <CategorySelect
            categories={categories}
            setCategories={setCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <div className="grid grid-cols-2 gap-4 mb-6">
            <input
              type="number"
              name="mrp"
              placeholder="MRP"
              value={formData.mrp}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
            <input
              type="number"
              name="purchasePrice"
              placeholder="Purchase Price"
              value={formData.purchasePrice}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div className="space-y-4 mb-6">
            <GstTaxSection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
            <ProductDetailsSection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
            <InventorySection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
            <DisplaySection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-purple-700 transition"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "SAVE"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

