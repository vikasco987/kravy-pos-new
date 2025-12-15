// "use client";

// import { useEffect, useState } from "react";

// export default function BusinessProfileCard() {
//   const [profile, setProfile] = useState<any>(null);

//   useEffect(() => {
//     async function fetchProfile() {
//       try {
//         const res = await fetch("/api/profile");
//         if (!res.ok) throw new Error("Failed to fetch profile");
//         const data = await res.json();
//         setProfile(data);
//       } catch (err) {
//         console.error(err);
//       }
//     }
//     fetchProfile();
//   }, []);

//   if (!profile) {
//     return <p className="text-gray-500">Loading profile...</p>;
//   }

//   return (
//     <div className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-6 space-y-4">
//       <h2 className="text-xl font-bold text-gray-800">
//         {profile.fields.find((f: any) => f.label === "Business Name")?.value}
//       </h2>
//       <p className="text-gray-600 italic">
//         {profile.fields.find((f: any) => f.label === "Tagline")?.value}
//       </p>

//       <div className="space-y-2">
//         <p>
//           <strong>Type:</strong>{" "}
//           {profile.fields.find((f: any) => f.label === "Business Type")?.value}
//         </p>
//         <p>
//           <strong>Contact:</strong>{" "}
//           {profile.fields.find((f: any) => f.label === "Contact Person Name")?.value}
//         </p>
//         <p>
//           <strong>Phone:</strong>{" "}
//           {profile.fields.find((f: any) => f.label === "Phone")?.value}
//         </p>
//         <p>
//           <strong>Email:</strong>{" "}
//           {profile.fields.find((f: any) => f.label === "Email")?.value}
//         </p>
//         <p>
//           <strong>UPI:</strong>{" "}
//           {profile.fields.find((f: any) => f.label === "UPI")?.value}
//         </p>
//       </div>

//       {profile.fields.find((f: any) => f.label === "Logo")?.fileUrl && (
//         <img
//           src={profile.fields.find((f: any) => f.label === "Logo")?.fileUrl}
//           alt="Business Logo"
//           className="w-32 h-32 object-contain mt-4"
//         />
//       )}
//     </div>
//   );
// }


// src/components/profile/BusinessProfileCard.tsx
"use client";

import React from "react";
import ProfileImage from "./ProfileImage";

export default function BusinessProfileCard({ profile }: { profile?: any | null }) {
  if (!profile) {
    return (
      <div>
        <h2 style={{ margin: 0 }}>—</h2>
        <p style={{ color: "#64748b" }}>No profile data</p>
      </div>
    );
  }

  // helper to safely find field value
  const getField = (label: string) => {
    if (!Array.isArray(profile.fields)) return "";
    const f = profile.fields.find((x: any) => String(x.label).toLowerCase() === label.toLowerCase());
    if (!f) return "";
    return f.value ?? f.fileUrl ?? "";
  };

  const businessName = profile.businessName ?? getField("Business Name") ?? "Unnamed Business";
  const tagline = profile.businessTagLine ?? getField("Tagline") ?? "";
  const businessType = profile.businessType ?? getField("Business Type") ?? "—";
  const contact = profile.contactPersonName ?? getField("Contact Person Name") ?? "—";
  const phone = profile.contactPersonPhone ?? getField("Phone") ?? "—";
  const email = profile.contactPersonEmail ?? getField("Email") ?? "—";
  const upi = profile.upi ?? getField("UPI") ?? "—";
  const logo = profile.logoUrl ?? getField("Logo") ?? undefined;

  return (
    <div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 110 }}>
          <ProfileImage src={logo} alt={businessName} />
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 className="business-name" style={{ marginBottom: 6 }}>{businessName}</h2>
          {tagline && <div className="tagline">{tagline}</div>}

          <div className="info-grid" style={{ marginTop: 6 }}>
            <div className="info-row"><strong>Type</strong><div style={{ color: "#475569" }}>{businessType}</div></div>
            <div className="info-row"><strong>Contact</strong><div style={{ color: "#475569" }}>{contact}</div></div>
            <div className="info-row"><strong>Phone</strong><div style={{ color: "#475569" }}>{phone}</div></div>
            <div className="info-row"><strong>Email</strong><div style={{ color: "#475569" }}>{email}</div></div>
            <div className="info-row"><strong>UPI</strong><div style={{ color: "#475569" }}>{upi}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
