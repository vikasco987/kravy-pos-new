"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { INDIA_STATE_DISTRICT } from "@/lib/india-state-district";


/* ---------------- SCHEMA ---------------- */
const schema = z.object({
  businessType: z.string().min(1),
  businessName: z.string().min(2),
  businessTagline: z.string().optional(),

  contactName: z.string().min(2),
  contactPhone: z.string().min(10),
  contactEmail: z.string().email(),

  upi: z.string().optional(),
  gstNumber: z.string().optional(),

  businessAddress: z.string().optional(),
  state: z.string().min(1),
  district: z.string().min(1),
  pinCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function BusinessProfileForm({
  mode,
  defaultValues,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues> & {
    profileImageUrl?: string;
    logoUrl?: string;
    signatureUrl?: string;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}) {

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(defaultValues?.state || "");


  const [profilePreview, setProfilePreview] = useState<string | null>(
    defaultValues?.profileImageUrl || null
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    defaultValues?.logoUrl || null
  );
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    defaultValues?.signatureUrl || null
  );

  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: FormValues) {
  setLoading(true);

  try {
    const getFile = (id: string) =>
      (document.getElementById(id) as HTMLInputElement)?.files?.[0];

    const profileImageUrl = getFile("profileImage")
      ? await uploadToCloudinary(getFile("profileImage")!)
      : defaultValues?.profileImageUrl || null;

    const logoUrl = getFile("logo")
      ? await uploadToCloudinary(getFile("logo")!)
      : defaultValues?.logoUrl || null;

    const signatureUrl = getFile("signature")
      ? await uploadToCloudinary(getFile("signature")!)
      : defaultValues?.signatureUrl || null;
    
    // ✅ EXPLICIT PAYLOAD (MATCHES API 1:1)
    const payload = {
      businessType: values.businessType,
      businessName: values.businessName,
      businessTagline: values.businessTagline ?? null,

      contactName: values.contactName,
      contactPhone: values.contactPhone,
      contactEmail: values.contactEmail,

      upi: values.upi ?? null,

      profileImage: profileImageUrl,
      logo: logoUrl,
      signature: signatureUrl,

      gstNumber: values.gstNumber ?? null,
      businessAddress: values.businessAddress ?? null,
      state: values.state,
      district: values.district,
      pinCode: values.pinCode ?? null,
    };

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    

    if (!res.ok) {
      console.error("Save failed:", data);
      alert("Failed to save profile");
      setLoading(false);
      return;
    }

    // ✅ SUCCESS → GO BACK TO /profile
if (!res.ok) {
  alert("Failed to save profile");
  return;
}

if (onSuccess) {
  onSuccess();
}

  } catch (err) {
    console.error("Submit error:", err);
    alert("Something went wrong");
  } finally {
    setLoading(false);
  }
}


  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* BUSINESS */}
      <Section title="Business Information">
        <Field label="Business Type">
          <select {...register("businessType")} className="input">
            <option value="">Select</option>
            <option value="food">Restaurant / Food</option>
            <option value="retail">Retail</option>
            <option value="service">Service</option>
          </select>
        </Field>

        <Field label="Business Name">
          <Input {...register("businessName")} />
        </Field>

        <Field label="Tagline">
          <Input {...register("businessTagline")} />
        </Field>
      </Section>

      {/* CONTACT */}
      <Section title="Contact Details">
        <Input {...register("contactName")} placeholder="Contact Person" />
        <Input {...register("contactPhone")} placeholder="Phone" />
        <Input {...register("contactEmail")} placeholder="Email" />
        <Input {...register("upi")} placeholder="UPI ID" />
      </Section>

      {/* ADDRESS */}
      <Section title="Business Address">
        <Input {...register("businessAddress")} placeholder="Full Address" />

        <select
          {...register("state")}
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="input"
        >
          <option value="">Select State</option>
          {Object.keys(INDIA_STATE_DISTRICT).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select {...register("district")} className="input">
          <option value="">Select District</option>
          {selectedState &&
            INDIA_STATE_DISTRICT[selectedState]?.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
        </select>

        <Input {...register("pinCode")} placeholder="PIN Code" />
        <Input {...register("gstNumber")} placeholder="GST Number" />
      </Section>

      {/* MEDIA */}
      <Section title="Branding">
        <DragDrop id="profileImage" label="Profile Image" preview={profilePreview} setPreview={setProfilePreview} />
        <DragDrop id="logo" label="Logo" preview={logoPreview} setPreview={setLogoPreview} />
        <DragDrop id="signature" label="Signature" preview={signaturePreview} setPreview={setSignaturePreview} />
      </Section>

      {/* ACTION */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- SMALL UI HELPERS ---------------- */

function Section({ title, children }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function DragDrop({ id, label, preview, setPreview }: any) {
  return (
    <label className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted transition">
      <input
        id={id}
        type="file"
        hidden
        onChange={(e) =>
          setPreview(
            e.target.files?.[0]
              ? URL.createObjectURL(e.target.files[0])
              : null
          )
        }
      />
      {preview ? (
        <img src={preview} className="h-28 mx-auto rounded object-cover" />
      ) : (
        <p className="text-sm text-muted-foreground">
          Click or drag to upload {label}
        </p>
      )}
    </label>
  );
}
