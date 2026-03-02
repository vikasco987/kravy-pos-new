



"use client";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function ImageUpload({
  image,
  setImage,
}: {
  image: string | null; // store Cloudinary secure_url
  setImage: (url: string | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🔹 Load saved image from localStorage on mount
  useEffect(() => {
    const savedImage = localStorage.getItem("uploadedImage");
    if (savedImage) setImage(savedImage);
  }, [setImage]);

  const handleFileSelect = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.secure_url) {
        console.error("Upload failed:", data.error || "No secure_url returned");
        alert("Upload failed: " + (data.error || "Unknown error"));
        return;
      }

      // ✅ Use only secure_url
      const url = data.secure_url;

      // Next Steps to Confirm Frontend Receives It:
      console.log("Frontend received Cloudinary URL:", url);

      // Save in state
      setImage(url);

      // Save in localStorage
      localStorage.setItem("uploadedImage", url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Something went wrong during upload!");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="mb-6 flex flex-col items-center gap-4"
    >
      <label
        htmlFor="fileUpload"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
          isDragging
            ? "border-purple-500 bg-purple-100"
            : "border-purple-300 bg-purple-50 hover:bg-purple-100"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="fileUpload"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
          }}
        />
        {uploading ? (
          <span className="text-sm text-purple-600 font-semibold">
            Uploading...
          </span>
        ) : image ? (
          <img
            src={image}
            alt="Uploaded"
            className="w-40 h-40 rounded-lg object-cover shadow-md"
          />
        ) : (
          <>
            <Upload className="w-8 h-8 text-purple-500 mb-2" />
            <span className="text-sm text-purple-700 font-semibold">
              Drag & Drop or Click
            </span>
          </>
        )}
      </label>
    </motion.div>
  );
}