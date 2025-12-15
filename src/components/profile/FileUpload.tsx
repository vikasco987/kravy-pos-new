// "use client";
// import { useState, useEffect } from "react";

// interface FileUploadProps {
//   label: string;
//   value: string | null;
//   onChange: (url: string | null) => void;
// }

// export default function FileUpload({ label, value, onChange }: FileUploadProps) {
//   const [preview, setPreview] = useState<string | null>(value);
//   const [uploading, setUploading] = useState(false);

//   useEffect(() => {
//     setPreview(value); // sync with parent form state
//   }, [value]);

//   const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Local preview
//     const reader = new FileReader();
//     reader.onloadend = () => setPreview(reader.result as string);
//     reader.readAsDataURL(file);

//     // Upload to backend
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
//         onChange(data.secure_url); // update parent state
//       } else {
//         console.error("Upload failed:", data.error);
//         onChange(null);
//       }
//     } catch (error) {
//       console.error("Error uploading file:", error);
//       onChange(null);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div>
//       <label className="block mb-2 font-medium">{label}</label>
//       <div className="w-full h-24 border rounded-lg flex items-center justify-center bg-gray-50 relative">
//         {preview ? (
//           <img src={preview} alt={label} className="h-24 object-contain" />
//         ) : (
//           <span className="text-gray-400">
//             {uploading ? "Uploading..." : `Upload ${label}`}
//           </span>
//         )}
//         <input
//           type="file"
//           accept="image/*"
//           className="absolute inset-0 opacity-0 cursor-pointer"
//           onChange={handleFile}
//         />
//       </div>
//     </div>
//   );
// }





// "use client";
// import { useState, useEffect } from "react";

// interface FileUploadProps {
//   label: string;
//   value: string | null;
//   onChange: (url: string | null) => void;
// }

// export default function FileUpload({ label, value, onChange }: FileUploadProps) {
//   const [preview, setPreview] = useState<string | null>(value);
//   const [uploading, setUploading] = useState(false);

//   useEffect(() => {
//     setPreview(value);
//   }, [value]);

//   const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onloadend = () => setPreview(reader.result as string);
//     reader.readAsDataURL(file);

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
//         onChange(data.secure_url);
//       } else {
//         onChange(null);
//         console.error("Upload failed:", data.error);
//       }
//     } catch (err) {
//       console.error("Upload error:", err);
//       onChange(null);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div>
//       <label className="block mb-2 font-medium">{label}</label>
//       <div className="w-full h-24 border rounded-lg flex items-center justify-center bg-gray-50 relative">
//         {preview ? (
//           <img src={preview} alt={label} className="h-24 object-contain" />
//         ) : (
//           <span className="text-gray-400">{uploading ? "Uploading..." : `Upload ${label}`}</span>
//         )}
//         <input
//           type="file"
//           accept="image/*"
//           className="absolute inset-0 opacity-0 cursor-pointer"
//           onChange={handleFile}
//         />
//       </div>
//     </div>
//   );
// }


/**
 * FileUpload component
 * - If NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set,
 *   upload to Cloudinary (unsigned).
 * - Otherwise fallback to reading file as data URL and return that.
 *
 * Props:
 *  - existingUrl?: string (to display)
 *  - onUpload(url: string | null): void
 *  - accept?: string
 */



"use client";

import React, { useState, useRef } from "react";

type Props = {
  existingUrl?: string;
  onUpload: (url: string | null) => void;
  label?: string;
  accept?: string;
  maxMb?: number;
};

export default function FileUpload({
  existingUrl,
  onUpload,
  label = "Upload",
  accept = "image/*",
  maxMb = 5,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(existingUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // public env variables for unsigned Cloudinary upload
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  function handleChoose() {
    inputRef.current?.click();
    setError(null);
    setSuccess(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    // validate size
    const maxBytes = maxMb * 1024 * 1024;
    if (f.size > maxBytes) {
      setError(`File too large. Max ${maxMb} MB.`);
      e.currentTarget.value = "";
      return;
    }

    // quick preview
    const tmp = URL.createObjectURL(f);
    setFilePreview(tmp);

    // auto start upload
    void uploadFile(f);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // If cloud name + preset are provided, perform unsigned upload directly to Cloudinary
      if (CLOUD_NAME && UPLOAD_PRESET) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

        const res = await fetch(url, {
          method: "POST",
          body: fd,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Cloudinary returns helpful error info
          const msg = json?.error?.message || json?.error || `Upload failed (${res.status})`;
          throw new Error(String(msg));
        }

        const uploadedUrl = json?.secure_url || json?.url;
        if (!uploadedUrl) throw new Error("Upload succeeded but no URL returned");
        setSuccess("Uploaded");
        onUpload(uploadedUrl);
        // keep the preview (Cloudinary url)
        setFilePreview(uploadedUrl);
        // clear success after a bit
        setTimeout(() => setSuccess(null), 2500);
        return;
      }

      // FALLBACK: call backend upload endpoint (server signs and uses secret)
      // Ensure your backend exposes POST /api/upload and returns { url: string }
      const form = new FormData();
      form.append("file", file);
      const res2 = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const json2 = await res2.json().catch(() => ({}));
      if (!res2.ok) {
        throw new Error(json2?.error || `Upload failed (${res2.status})`);
      }
      if (!json2?.url) throw new Error("Upload succeeded but no URL returned");
      setSuccess("Uploaded");
      onUpload(json2.url);
      setFilePreview(json2.url);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message ?? "Upload failed");
      onUpload(null);
      // keep preview as-is (so user can retry)
    } finally {
      setUploading(false);
      // reset file input value so same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    setFilePreview(null);
    setError(null);
    setSuccess(null);
    onUpload(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{label}</label>

      <div style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <div style={{
          width: 96,
          height: 96,
          borderRadius: 12,
          overflow: "hidden",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {filePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center", padding: 8, color: "#6b7280" }}>
              No<br/>Image
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={handleChoose}
            disabled={uploading}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e6e7eb",
              background: "#fff",
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {uploading ? "Uploading…" : "Choose file"}
          </button>

          {filePreview && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #e6e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          )}

          <div style={{ color: "#6b7280", fontSize: 13 }}>
            {maxMb} MB max
            {!CLOUD_NAME || !UPLOAD_PRESET ? " — using server upload" : " — direct cloud upload"}
          </div>
        </div>
      </div>

      <div style={{ minHeight: 22 }}>
        {success && <div style={{ color: "#065f46", fontWeight: 700 }}>{success}</div>}
        {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</div>}
      </div>
    </div>
);
}
