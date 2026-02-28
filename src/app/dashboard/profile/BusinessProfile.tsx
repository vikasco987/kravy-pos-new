// // src/app/profile/page.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import BusinessProfileCard from "@/components/profile/BusinessProfileCard";
// import ProfileForm from "@/components/profile/ProfileForm";

// type ProfileType = any;

// export default function ProfilePage() {
//   const [profile, setProfile] = useState<ProfileType | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [editing, setEditing] = useState<boolean>(false);
//   const [notice, setNotice] = useState<string | null>(null);

//   const loadProfile = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch("/api/profile");
//       if (res.status === 404) {
//         // no profile yet
//         setProfile(null);
//         setLoading(false);
//         return;
//       }
//       if (!res.ok) {
//         const txt = await res.text().catch(() => "");
//         throw new Error(txt || `Failed to fetch (${res.status})`);
//       }
//       const data = await res.json();
//       setProfile(data);
//     } catch (err: any) {
//       console.error("Profile load error:", err);
//       setError(err?.message ?? "Failed to load profile");
//       setProfile(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void loadProfile();
//   }, []);

//   const handleEditToggle = () => {
//     setEditing((s) => !s);
//   };

//   const handleSaved = async () => {
//     // called by ProfileForm after successful save
//     setNotice("Saved successfully");
//     setEditing(false);
//     // reload profile and show it
//     await loadProfile();
//     window.setTimeout(() => setNotice(null), 2500);
//   };

//   return (
//     <div className="profile-page-wrapper">
//       <div className="profile-page-container">
//         <h1 className="profile-page-title">Business Profile</h1>

//         {notice && (
//           <div className="pp-toast pp-toast--success" role="status">
//             {notice}
//             <button className="pp-toast-close" onClick={() => setNotice(null)}>✕</button>
//           </div>
//         )}

//         <section className="profile-section">
//           {loading ? (
//             <div className="card profile-loading">
//               Loading profile...
//             </div>
//           ) : error ? (
//             <div className="card">
//               <div style={{ color: "#b91c1c", fontWeight: 700 }}>Error</div>
//               <div style={{ marginTop: 8 }}>{error}</div>
//             </div>
//           ) : editing ? (
//             // Edit mode: show the form with initialData (profile may be null for create)
//             <div className="card">
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
//                 <div style={{ fontWeight: 700 }}>Edit Business Profile</div>
//                 <div style={{ display: "flex", gap: 8 }}>
//                   <button className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
//                 </div>
//               </div>

//               <ProfileForm initialData={profile} onSaved={handleSaved} />
//             </div>
//           ) : (
//             // View mode: show the saved card OR a prompt to create
//             <>
//               {profile ? (
//                 <div className="card card-body horizontal">
//                   <div style={{ flex: 1 }}>
//                     <BusinessProfileCard profile={profile} />
//                     <div style={{ marginTop: 14 }}>
//                       <div className="action-buttons">
//                         <button className="btn primary small" onClick={() => setEditing(true)}>Edit</button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="card">
//                   <p style={{ margin: 0, fontWeight: 700 }}>No business profile found.</p>
//                   <p style={{ marginTop: 8, color: "#475569" }}>Click below to create one.</p>
//                   <div style={{ marginTop: 14 }}>
//                     <button className="btn primary" onClick={() => setEditing(true)}>Create Profile</button>
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </section>
//       </div>
//     </div>
//   );
// }




"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

import BusinessProfileForm from "./_components/BusinessProfileForm";

export default function BusinessProfile({
  data,
  onProfileUpdated,
}: {
  data: any;
  onProfileUpdated: () => void;
}) {
  const [editMode, setEditMode] = useState(false);

  if (editMode) {
    return (
      <BusinessProfileForm
        mode="edit"
        defaultValues={{
          businessType: data.businessType,
          businessName: data.businessName,
          businessTagline: data.businessTagLine,

          contactName: data.contactPersonName,
          contactPhone: data.contactPersonPhone,
          contactEmail: data.contactPersonEmail,

          upi: data.upi,
          gstNumber: data.gstNumber,

          businessAddress: data.businessAddress,
          state: data.state,
          district: data.district,
          pinCode: data.pinCode,

          profileImageUrl: data.profileImageUrl,
          logoUrl: data.logoUrl,
          signatureUrl: data.signatureUrl,
        }}
        onCancel={() => setEditMode(false)}
        onSuccess={() => {
          setEditMode(false);
          onProfileUpdated();
        }}
      />
    );
  }
  /* ================= SMALL HELPERS ================= */

function Info({
  label,
  value,
  fallback = "-",
}: {
  label: string;
  value?: string | null;
  fallback?: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right text-gray-900">
        {value || fallback}
      </span>
    </div>
  );
}

function BrandBox({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) {
  return (
    <div className="text-center">
      <div className="relative h-32 w-full rounded-xl border bg-gray-100 overflow-hidden">
        <Image
          src={url || "/no-image.png"}
          alt={label}
          fill
          className="object-contain p-4"
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}


  return (
    <div className="max-w-5xl mx-auto p-6">
  <Card className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-gray-200 overflow-hidden">
    {/* ================= TOP PROFILE ================= */}
    <div className="relative px-8 pt-12 pb-8 text-center">
      {/* Edit */}
      <Button
        size="sm"
        variant="outline"
        className="absolute top-6 right-6 rounded-full shadow-sm"
        onClick={() => setEditMode(true)}
      >
        <Pencil size={14} />
        Edit
      </Button>

      {/* Avatar */}
      <div className="mx-auto w-32 h-32 rounded-full p-[3px] bg-linear-to-tr from-primary via-purple-500 to-pink-500">
        <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
          <Image
            src={data.profileImageUrl || data.logoUrl || "/no-image.png"}
            alt="Business Profile"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight">
        {data.businessName}
      </h1>

      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        {data.businessTagLine || "—"}
      </p>

      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        {data.state && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {data.state}
          </span>
        )}
        {data.district && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600">
            {data.district}
          </span>
        )}
      </div>
    </div>

    {/* ================= DIVIDER ================= */}
    <div className="border-t" />

    {/* ================= DETAILS GRID ================= */}
    <div className="grid md:grid-cols-2 gap-8 px-8 py-8">
      {/* CONTACT */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          Customer Information
        </h3>

        <Info label="Contact Person" value={data.contactPersonName} />
        <Info label="Phone" value={data.contactPersonPhone} />
        <Info label="Email" value={data.contactPersonEmail} />
        <Info label="UPI" value={data.upi} fallback="Not Added" />
      </div>

      {/* BUSINESS */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          Business Details
        </h3>

        <Info label="Business Type" value={data.businessType} />
        <Info label="GST Number" value={data.gstNumber} fallback="Not Registered" />
        <Info label="Address" value={data.businessAddress} />
        <Info label="State" value={data.state} />
        <Info label="District" value={data.district} />
        <Info label="PIN Code" value={data.pinCode} />
      </div>
    </div>

    {/* ================= BRANDING ================= */}
    <div className="border-t" />

    <div className="px-8 py-8">
      <h3 className="text-sm font-semibold text-gray-500 mb-4">
        Branding
      </h3>

      <div className="grid sm:grid-cols-2 gap-6">
        <BrandBox label="Logo" url={data.logoUrl} />
        <BrandBox label="Signature" url={data.signatureUrl} />
      </div>
    </div>
  </Card>
</div>
  );
}
