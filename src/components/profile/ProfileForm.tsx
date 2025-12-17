// src/components/profile/ProfileForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProfileImage from "./ProfileImage";
import FileUpload from "./FileUpload";
import InputField from "./InputField";
import SelectField from "./SelectField";
import "./profile.css";

type Props = {
  initialData?: any | null;
  onSaved?: () => void;
};

export default function ProfileForm({ initialData = null, onSaved }: Props) {
  /* ----------------------------------------------
     1. CLEAN EMPTY STATE (reset clears to this)
  ---------------------------------------------- */
  const emptyState = {
    businessType: "",
    businessName: "",
    businessTagline: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    upi: "",
    reviewLink: "",
    logoUrl: null as string | null,
    signatureUrl: null as string | null,
  };

  /* ----------------------------------------------
     2. SETUP INITIAL DATA (for edit mode)
  ---------------------------------------------- */
  const buildInitial = (data: any | null) => {
    if (!data) return emptyState;

    const findField = (label: string) => {
      if (!Array.isArray(data.fields)) return "";
      const f = data.fields.find(
        (x: any) => String(x.label).toLowerCase() === label.toLowerCase()
      );
      if (!f) return "";
      return f.value ?? f.fileUrl ?? "";
    };

    return {
      businessType: data.businessType ?? findField("Business Type") ?? "",
      businessName: data.businessName ?? findField("Business Name") ?? "",
      businessTagline: data.businessTagLine ?? findField("Tagline") ?? "",
      contactName: data.contactPersonName ?? findField("Contact Person Name") ?? "",
      contactPhone: data.contactPersonPhone ?? findField("Phone") ?? "",
      contactEmail: data.contactPersonEmail ?? findField("Email") ?? "",
      upi: data.upi ?? findField("UPI") ?? "",
      reviewLink: data.googleReviewUrl ?? findField("Google Review Link") ?? "",
      logoUrl: data.logoUrl ?? findField("Logo") ?? null,
      signatureUrl: data.signatureUrl ?? findField("Signature") ?? null,
    };
  };

  /* ----------------------------------------------
     3. INITIAL + FORM STATES
  ---------------------------------------------- */
  const initialState = useMemo(() => buildInitial(initialData), [initialData]);
  const [form, setForm] = useState({ ...initialState });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ ...initialState });
  }, [initialState]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  /* ----------------------------------------------
     4. VALIDATION
  ---------------------------------------------- */
  const validate = () => {
    if (!form.businessType) return "Business type is required";
    if (!form.businessName) return "Business name is required";
    if (!form.contactName) return "Contact person is required";
    if (!form.contactPhone) return "Phone is required";
    if (!form.contactEmail) return "Email is required";
    return null;
  };

  async function safeParseJson(res: Response) {
    try {
      return await res.json();
    } catch {
      try {
        return { text: await res.text() };
      } catch {
        return null;
      }
    }
  }

  /* ----------------------------------------------
     5. SUBMIT HANDLER
  ---------------------------------------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        businessType: form.businessType,
        businessName: form.businessName,
        businessTagline: form.businessTagline,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        upi: form.upi,
        reviewLink: form.reviewLink,
        logo: form.logoUrl || "",
        signature: form.signatureUrl || "",
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeParseJson(res);
      if (!res.ok) throw new Error(data?.error || "Save failed");

      setSuccess("Saved successfully!");
      onSaved?.();

      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err?.message ?? "Save failed");
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------------
     6. RESET → CLEAR EVERYTHING
  ---------------------------------------------- */
  function handleReset() {
    setError(null);
    setSuccess(null);
    setForm({ ...emptyState }); // FULL BLANK RESET
  }

  /* ----------------------------------------------
     7. UI
  ---------------------------------------------- */
  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        {/* LEFT SIDE — IMAGES */}
        <div className="form-col image-col">
          <ProfileImage src={form.logoUrl ?? undefined} alt={form.businessName} />
          <div style={{ height: 12 }} />

          <FileUpload
            existingUrl={form.logoUrl ?? undefined}
            onUpload={(url) => update("logoUrl", url)}
          />

          <div style={{ height: 12 }} />
          <div className="muted">Signature</div>

          <FileUpload
            existingUrl={form.signatureUrl ?? undefined}
            onUpload={(url) => update("signatureUrl", url)}
          />
        </div>

        {/* RIGHT SIDE — FORM FIELDS */}
        <div className="form-col fields-col">
          <SelectField
            label="Business Type"
            name="businessType"
            value={form.businessType}
            required
            options={[
              { value: "restaurant", label: "Restaurant / Cafe" },
              { value: "grocery", label: "Grocery / Store" },
              { value: "services", label: "Service / Salon" },
              { value: "other", label: "Other" },
            ]}
            onChange={(v) => update("businessType", v)}
          />

<InputField
  name="businessName"
  label="Business Name"
  required
  value={form.businessName}
  onChange={(v) => update("businessName", v)}
/>
<InputField
  name="businessTagline"
  label="Tagline"
  value={form.businessTagline}
  onChange={(v) => update("businessTagline", v)}
/>
<InputField
  name="contactName"
  label="Contact Person Name"
  required
  value={form.contactName}
  onChange={(v) => update("contactName", v)}
/>

<div className="two-col">
<InputField
  name="contactPhone"
  label="Phone"
  required
  value={form.contactPhone}
  onChange={(v) => update("contactPhone", v)}
/>

<InputField
  name="contactEmail"
  label="Email"
  required
  value={form.contactEmail}
  onChange={(v) => update("contactEmail", v)}
/>

          </div>

          <div className="two-col">
<InputField
  name="upi"
  label="UPI"
  value={form.upi}
  onChange={(v) => update("upi", v)}
/>

<InputField
  name="reviewLink"
  label="Google Review Link"
  value={form.reviewLink}
  onChange={(v) => update("reviewLink", v)}
/>

          </div>

          {/* BUTTONS */}
          <div className="pp-btn-group">
            <button className="pp-btn primary" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </button>

            <button className="pp-btn reset" type="button" onClick={handleReset} disabled={loading}>
              Reset
            </button>
          </div>

          {/* SUCCESS / ERROR */}
          <div className="messages">
            {success && <div className="msg success">{success}</div>}
            {error && <div className="msg error">{error}</div>}
          </div>
        </div>
      </div>
    </form>
  );
}
