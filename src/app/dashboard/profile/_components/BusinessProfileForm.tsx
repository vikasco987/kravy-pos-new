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

  const { register, handleSubmit, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchedValues = watch();

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
    <div className="flex flex-col xl:flex-row gap-6 max-w-[1400px] mx-auto p-6 items-start">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 transition-colors"
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

    {/* LIVE BILL PREVIEW */}
    <div className="w-[380px] shrink-0 sticky top-24 hidden xl:block shadow-2xl rounded-[32px] overflow-hidden border border-[var(--kravy-border)] bg-[var(--kravy-surface)] animate-in fade-in slide-in-from-right-8 transition-all">
      <div className="px-6 py-5 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/50">
        <h3 className="text-base font-black text-[var(--kravy-text-primary)] tracking-tight">Live Receipt Preview</h3>
        <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider mt-0.5">See how your printed bill looks</p>
      </div>
      <div className="p-8 bg-[#E5E5E5] dark:bg-[#1A1A1A] flex justify-center min-h-[500px]">
        <div 
          className="bg-white text-black p-4 shadow-xl origin-top mx-auto filter hover:brightness-[0.98] transition-all"
          style={{ width: '58mm', minHeight: '100px', transform: 'scale(1.3)', marginBottom: '30px' }}
        >
          <div className="font-mono text-[10px] leading-tight">
            {logoPreview && (
              <div className="flex justify-center mb-1">
                <img src={logoPreview} alt="Logo" className="max-h-[28mm] object-contain" />
              </div>
            )}
            <div className="text-center font-bold text-[12px]">{watchedValues.businessName || "Your Business"}</div>
            {(watchedValues.businessAddress || watchedValues.district || selectedState || watchedValues.pinCode) && (
              <div className="text-center text-[9px] mt-0.5 opacity-90 text-[10px]">
                {watchedValues.businessAddress}
                {watchedValues.district && `, ${watchedValues.district}`}
                {selectedState && `, ${selectedState}`}
                {watchedValues.pinCode && ` - ${watchedValues.pinCode}`}
              </div>
            )}
            {watchedValues.gstNumber && <div className="text-center text-[9px] mt-0.5 opacity-90 text-[10px]">GSTIN: {watchedValues.gstNumber}</div>}
            
            <div className="text-center text-[9px] mt-1.5 opacity-90 text-[10px]">
              <div>Bill No: SV-SAMPLE</div>
              <div>Date: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })}</div>
            </div>
            
            <div className="my-1.5 border-t border-dashed border-gray-400" />
            
            <div className="flex justify-between font-semibold text-[9px] opacity-90 text-[10px]">
              <span className="w-[26mm]">Item Name</span>
              <span className="w-[8mm] text-right">Qty</span>
              <span className="w-[10mm] text-right">Rate</span>
              <span className="w-[10mm] text-right">Total</span>
            </div>
            
            <div className="border-t border-dashed border-gray-400 my-1" />
            
            <div className="flex justify-between text-[9px] opacity-90 text-[10px]">
              <span className="w-[26mm] truncate">Sample Item</span>
              <span className="w-[8mm] text-right">1</span>
              <span className="w-[10mm] text-right">99.00</span>
              <span className="w-[10mm] text-right">99.00</span>
            </div>
            
            <div className="my-1 border-t border-dashed border-gray-400" />
            
            <div className="flex justify-between opacity-90 text-[10px]"><span>Subtotal</span><span>₹99.00</span></div>
            <div className="flex justify-between opacity-90 text-[10px]"><span>GST (5%)</span><span>₹4.95</span></div>
            
            <div className="border-t border-dashed border-gray-400 my-1.5" />
            
            <div className="flex justify-between font-bold text-[11px] text-[12px]"><span>GRAND TOTAL</span><span>₹103.95</span></div>
            
            <div className="border-t border-dashed border-gray-400 my-1.5" />
            
            <div className="text-center text-[9px] opacity-90 text-[10px]">Payment: UPI</div>
            
            {watchedValues.upi && (
              <>
                <div className="flex justify-center my-2.5">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${watchedValues.upi}&pn=${watchedValues.businessName || "Store"}&am=103.95&cu=INR`)}`} 
                    alt="UPI QR" 
                    className="w-[30mm] shadow-sm mix-blend-multiply" 
                  />
                </div>
                <div className="text-center text-[9px] opacity-90 text-[10px]">UPI: {watchedValues.upi}</div>
              </>
            )}
            
            {watchedValues.businessTagline && <div className="text-center text-[9px] mt-1.5 opacity-90 text-[10px] italic">{watchedValues.businessTagline}</div>}
            <div className="text-center font-semibold mt-1 opacity-90 text-[10px]">Thank you 🙏</div>
          </div>
        </div>
      </div>
    </div>

  </div>
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
