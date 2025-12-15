// src/components/profile/ProfileDrawer.tsx
"use client";

import React, { useEffect, useState } from "react";

/**
 * Drawer that:
 * - fetches profiles from /api/profile
 * - shows list (supports array or single object)
 * - allows edit/create via built-in form
 *
 * NOTE: This calls your existing /api/profile POST and GET routes.
 */

type ProfileShape = any;

export default function ProfileDrawer({ onClose }: { onClose: () => void }) {
  const [profiles, setProfiles] = useState<ProfileShape[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // form state
  const [form, setForm] = useState({
    businessType: "",
    businessName: "",
    businessTagline: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    upi: "",
    reviewLink: "",
    gstNumber: "",
    businessAddress: "",
    state: "",
    pinCode: "",
    logo: "", // URL
    profileImage: "",
    signature: "",
  });

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile");
      if (res.status === 404) {
        setProfiles([]);
        setSelectedIndex(null);
        setForm(initialForm());
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "Failed to load profile");
        throw new Error(txt || "Failed to load profile");
      }
      const data = await res.json();
      // Accept either a single object or array
      const arr = Array.isArray(data) ? data : (data ? [data] : []);
      setProfiles(arr);
      if (arr.length > 0) {
        setSelectedIndex(0);
        setFormFromProfile(arr[0]);
      } else {
        setSelectedIndex(null);
        setForm(initialForm());
      }
    } catch (err: any) {
      console.error("Fetch profile error:", err);
      setMessage({ type: "error", text: err?.message ?? "Failed to fetch profiles" });
    } finally {
      setLoading(false);
    }
  }

  function initialForm() {
    return {
      businessType: "",
      businessName: "",
      businessTagline: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      upi: "",
      reviewLink: "",
      gstNumber: "",
      businessAddress: "",
      state: "",
      pinCode: "",
      logo: "",
      profileImage: "",
      signature: "",
    };
  }

  function setFormFromProfile(profile: any) {
    // Try to read profile in multiple shapes:
    // - profile.fields array with { label, value/fileUrl }
    // - flat object with keys like businessName, contactPersonName, logoUrl
    const get = (label: string) => {
      if (!profile) return "";
      // fields array:
      if (Array.isArray(profile.fields)) {
        const f = profile.fields.find((x: any) => String(x.label).toLowerCase() === label.toLowerCase());
        if (f) return f.value ?? f.fileUrl ?? "";
      }
      // common flat keys:
      const map: Record<string, string[]> = {
        businessType: ["businessType", "business_type"],
        businessName: ["businessName", "business_name"],
        businessTagline: ["businessTagLine", "tagline"],
        contactName: ["contactPersonName", "contact_name"],
        contactPhone: ["contactPersonPhone", "phone", "mobile"],
        contactEmail: ["contactPersonEmail", "email"],
        upi: ["upi"],
        reviewLink: ["googleReviewUrl", "reviewLink"],
        gstNumber: ["gstNumber"],
        businessAddress: ["businessAddress"],
        state: ["state"],
        pinCode: ["pinCode"],
        logo: ["logoUrl", "logo"],
        profileImage: ["profileImageUrl", "profileImage"],
        signature: ["signatureUrl", "signature"],
      };
      const keys = map[label] ?? [label];
      for (const k of keys) {
        if (profile[k]) return profile[k];
      }
      return "";
    };

    setForm({
      businessType: get("businessType"),
      businessName: get("businessName"),
      businessTagline: get("businessTagline"),
      contactName: get("contactName"),
      contactPhone: get("contactPhone"),
      contactEmail: get("contactEmail"),
      upi: get("upi"),
      reviewLink: get("reviewLink"),
      gstNumber: get("gstNumber"),
      businessAddress: get("businessAddress"),
      state: get("state"),
      pinCode: get("pinCode"),
      logo: get("logo"),
      profileImage: get("profileImage"),
      signature: get("signature"),
    });
  }

  function onSelectProfile(i: number) {
    setSelectedIndex(i);
    setFormFromProfile(profiles[i]);
    setMessage(null);
  }

  function onChange(key: string, value: string) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    // minimal validation
    if (!form.businessName || !form.contactPhone) {
      setMessage({ type: "error", text: "Please fill business name and phone." });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: form.businessType,
          businessName: form.businessName,
          businessTagline: form.businessTagline,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          upi: form.upi,
          reviewLink: form.reviewLink,
          gstNumber: form.gstNumber,
          businessAddress: form.businessAddress,
          state: form.state,
          pinCode: form.pinCode,
          profileImage: form.profileImage,
          logo: form.logo,
          signature: form.signature,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setMessage({ type: "success", text: "Profile saved." });

      // refresh list
      await fetchProfiles();
    } catch (err: any) {
      console.error("Save profile error:", err);
      setMessage({ type: "error", text: err?.message ?? "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function onCreateNew() {
    setSelectedIndex(null);
    setForm(initialForm());
    setMessage(null);
  }

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* drawer */}
      <aside className="fixed right-0 top-0 h-full w-full sm:w-[720px] md:w-[820px] lg:w-[920px] bg-white z-50 shadow-2xl overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Business Profiles</h3>
          <div className="flex items-center gap-2">
            <button onClick={fetchProfiles} className="text-sm px-3 py-1 rounded bg-gray-100">Refresh</button>
            <button onClick={onClose} className="text-sm px-3 py-1 rounded bg-red-50 text-red-600">Close</button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* left: list */}
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Saved profiles</h4>
              <button onClick={onCreateNew} className="text-sm text-indigo-600">+ New</button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-auto pr-2">
              {loading && <div className="text-sm text-gray-500">Loading...</div>}
              {!loading && profiles.length === 0 && <div className="text-sm text-gray-500">No profiles yet.</div>}
              {profiles.map((p, i) => {
                const name =
                  (Array.isArray(p?.fields) && (p.fields.find((f:any)=>f.label==="Business Name")?.value)) ||
                  p.businessName ||
                  p.business_name ||
                  `Profile ${i + 1}`;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border cursor-pointer ${selectedIndex === i ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-100"}`}
                    onClick={() => onSelectProfile(i)}
                  >
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.contactPersonName || p.contactName || p.contact || ""}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* right: form */}
          <div className="col-span-2">
            <form onSubmit={onSave} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={form.businessName} onChange={(e)=>onChange("businessName", e.target.value)} placeholder="Business name*" className="w-full border p-2 rounded" />
                <input value={form.businessType} onChange={(e)=>onChange("businessType", e.target.value)} placeholder="Business type" className="w-full border p-2 rounded" />
                <input value={form.contactName} onChange={(e)=>onChange("contactName", e.target.value)} placeholder="Contact person name" className="w-full border p-2 rounded" />
                <input value={form.contactPhone} onChange={(e)=>onChange("contactPhone", e.target.value)} placeholder="Phone*" className="w-full border p-2 rounded" />
                <input value={form.contactEmail} onChange={(e)=>onChange("contactEmail", e.target.value)} placeholder="Email" className="w-full border p-2 rounded" />
                <input value={form.upi} onChange={(e)=>onChange("upi", e.target.value)} placeholder="UPI ID" className="w-full border p-2 rounded" />
                <input value={form.gstNumber} onChange={(e)=>onChange("gstNumber", e.target.value)} placeholder="GST number" className="w-full border p-2 rounded" />
                <input value={form.reviewLink} onChange={(e)=>onChange("reviewLink", e.target.value)} placeholder="Google review link" className="w-full border p-2 rounded" />
              </div>

              <textarea value={form.businessTagline} onChange={(e)=>onChange("businessTagline", e.target.value)} placeholder="Tagline" className="w-full border p-2 rounded" rows={2} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={form.businessAddress} onChange={(e)=>onChange("businessAddress", e.target.value)} placeholder="Address" className="w-full border p-2 rounded" />
                <input value={form.state} onChange={(e)=>onChange("state", e.target.value)} placeholder="State" className="w-full border p-2 rounded" />
                <input value={form.pinCode} onChange={(e)=>onChange("pinCode", e.target.value)} placeholder="Pin code" className="w-full border p-2 rounded" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={form.logo} onChange={(e)=>onChange("logo", e.target.value)} placeholder="Logo URL" className="w-full border p-2 rounded" />
                <input value={form.profileImage} onChange={(e)=>onChange("profileImage", e.target.value)} placeholder="Profile image URL" className="w-full border p-2 rounded" />
                <input value={form.signature} onChange={(e)=>onChange("signature", e.target.value)} placeholder="Signature URL" className="w-full border p-2 rounded" />
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>

                <button type="button" onClick={()=>{ setForm(initialForm()); setSelectedIndex(null); setMessage(null); }} className="px-3 py-2 rounded border">
                  Reset
                </button>

                <div className="ml-auto text-sm">
                  <button type="button" onClick={()=>{ navigator.clipboard?.writeText(JSON.stringify(form)) }} className="text-xs text-gray-500">Copy JSON</button>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message.text}
                </div>
              )}
            </form>

            {/* preview card */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded overflow-hidden flex items-center justify-center border">
                    {form.logo ? <img src={form.logo} alt="logo" className="object-contain max-h-full" /> : <div className="text-gray-400 text-xl">{(form.businessName || "B").slice(0,1)}</div>}
                  </div>
                  <div>
                    <div className="font-semibold">{form.businessName || "Unnamed"}</div>
                    <div className="text-sm text-gray-500">{form.businessTagline}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-700">
                  <div><strong>Contact</strong>: {form.contactName || "—"}</div>
                  <div><strong>Phone</strong>: {form.contactPhone || "—"}</div>
                  <div><strong>Email</strong>: {form.contactEmail || "—"}</div>
                  <div><strong>UPI</strong>: {form.upi || "—"}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}
