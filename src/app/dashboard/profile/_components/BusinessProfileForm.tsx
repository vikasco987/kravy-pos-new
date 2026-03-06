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
import { Plus } from "lucide-react";
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
      className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 transition-colors"
    >
      {/* BUSINESS */}
      <Section title="Business Information">
        <Field label="Business Type">
          <select {...register("businessType")} className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-11 px-4 focus:ring-2 focus:ring-[var(--kravy-brand)]/20 transition-all outline-none font-bold">
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
        <Input {...register("contactName")} placeholder="Contact Person" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        <Input {...register("contactPhone")} placeholder="Phone" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        <Input {...register("contactEmail")} placeholder="Email" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        <Input {...register("upi")} placeholder="UPI ID" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
      </Section>

      {/* ADDRESS */}
      <Section title="Business Address">
        <Input {...register("businessAddress")} placeholder="Full Address" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />

        <select
          {...register("state")}
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-11 px-4 outline-none font-bold focus:ring-2 focus:ring-[var(--kravy-brand)]/20"
        >
          <option value="">Select State</option>
          {Object.keys(INDIA_STATE_DISTRICT).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select {...register("district")} className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-11 px-4 outline-none font-bold focus:ring-2 focus:ring-[var(--kravy-brand)]/20">
          <option value="">Select District</option>
          {selectedState &&
            INDIA_STATE_DISTRICT[selectedState]?.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
        </select>

        <Input {...register("pinCode")} placeholder="PIN Code" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        <Input {...register("gstNumber")} placeholder="GST Number" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
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
        <Button type="submit" disabled={loading} className="bg-[var(--kravy-brand)] text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- SMALL UI HELPERS ---------------- */

function Section({ title, children }: any) {
  return (
    <Card className="rounded-[32px] border-[var(--kravy-border)] bg-[var(--kravy-surface)] shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/50">
        <CardTitle className="text-lg font-black text-[var(--kravy-text-primary)] tracking-tight uppercase tracking-widest text-[10px] opacity-70">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6 p-8">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest ml-1">{label}</Label>
      {children}
    </div>
  );
}

function DragDrop({ id, label, preview, setPreview }: any) {
  return (
    <label className="group border-2 border-dashed border-[var(--kravy-border)] rounded-2xl p-6 text-center cursor-pointer hover:bg-[var(--kravy-surface-hover)] hover:border-indigo-500/50 transition-all">
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
        <div className="relative group">
          <img src={preview} className="h-32 mx-auto rounded-xl object-cover shadow-lg border border-[var(--kravy-border)]" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
            <p className="text-white text-xs font-bold">Change Image</p>
          </div>
        </div>
      ) : (
        <div className="py-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--kravy-brand)]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="text-[var(--kravy-brand)]" size={24} />
          </div>
          <p className="text-sm font-bold text-[var(--kravy-text-primary)]">Upload {label}</p>
          <p className="text-xs text-[var(--kravy-text-muted)] mt-1">PNG, JPG up to 5MB</p>
        </div>
      )}
    </label>
  );
}
