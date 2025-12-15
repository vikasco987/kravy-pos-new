// "use client";
// import { useState } from "react";
// import { Camera } from "lucide-react"; // optional icon

// export default function ProfileImage() {
//   const [profileImage, setProfileImage] = useState<string | null>(null);

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => setProfileImage(reader.result as string);
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-md">
//       {/* Profile Image */}
//       <div className="relative">
//         <img
//           src={profileImage || "https://via.placeholder.com/100"}
//           alt="Profile"
//           className="w-28 h-28 rounded-full object-cover border-4 border-purple-500 shadow"
//         />
//         <label className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 transition text-white px-3 py-1 rounded-lg cursor-pointer text-sm flex items-center gap-1">
//           <Camera size={14} /> Change
//           <input type="file" className="hidden" onChange={handleImageUpload} />
//         </label>
//       </div>

//       {/* Buttons */}
//       <button className="mt-4 text-purple-700 font-semibold hover:underline">
//         Switch Profile
//       </button>
//       <button className="mt-2 bg-purple-600 hover:bg-purple-700 transition text-white px-4 py-2 rounded-lg shadow">
//         + Add New Profile
//       </button>
//     </div>
//   );
// }















// "use client";

// import { useState } from "react";
// import { Camera } from "lucide-react";

// interface ProfileImageProps {
//   value: string | null;
//   onChange: (url: string | null) => void;
// }

// export default function ProfileImage({ value, onChange }: ProfileImageProps) {
//   const [profileImage, setProfileImage] = useState<string | null>(value);
//   const [uploading, setUploading] = useState(false);

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Preview locally
//     const reader = new FileReader();
//     reader.onloadend = () => setProfileImage(reader.result as string);
//     reader.readAsDataURL(file);

//     // Upload to Cloudinary
//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       setUploading(true);
//       const res = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await res.json();
//       if (data.secure_url) {
//         console.log("✅ Cloudinary URL:", data.secure_url);
//         setProfileImage(data.secure_url);
//         onChange(data.secure_url); // update parent form
//       } else {
//         console.error("Upload failed:", data.error);
//         onChange(null);
//       }
//     } catch (err) {
//       console.error("Error uploading profile image:", err);
//       onChange(null);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-md">
//       {/* Profile Image */}
//       <div className="relative">
//         <img
//           src={profileImage || "https://via.placeholder.com/100"}
//           alt="Profile"
//           className="w-28 h-28 rounded-full object-cover border-4 border-purple-500 shadow"
//         />
//         <label className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 transition text-white px-3 py-1 rounded-lg cursor-pointer text-sm flex items-center gap-1">
//           <Camera size={14} /> {uploading ? "Uploading..." : "Change"}
//           <input
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={handleImageUpload}
//           />
//         </label>
//       </div>

//       {/* Buttons */}
//       <button className="mt-4 text-purple-700 font-semibold hover:underline">
//         Switch Profile
//       </button>
//       <button className="mt-2 bg-purple-600 hover:bg-purple-700 transition text-white px-4 py-2 rounded-lg shadow">
//         + Add New Profile
//       </button>
//     </div>
//   );
// }


// src/components/profile/ProfileImage.tsx
"use client";
import React from "react";

export default function ProfileImage({ src, alt = "logo", size = 96 }: { src?: string; alt?: string; size?: number }) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 12,
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "1px solid #e6eef6",
  };

  return (
    <div style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <div style={{ color: "#475569", fontWeight: 700 }}>{(alt || "B").slice(0,1).toUpperCase()}</div>
      )}
    </div>
  );
}

