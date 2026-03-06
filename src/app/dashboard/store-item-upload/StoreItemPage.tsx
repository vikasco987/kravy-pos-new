"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Copy, Trash2, RefreshCw } from "lucide-react";

/* =============================
   TYPES
============================= */
type Category = { id: string; name: string };

type ClerkOption = {
  clerkId: string;
  label: string;
  email: string;
};

type StoreItem = {
  id?: string;
  name: string;
  price: number | null;
  categoryId: string | null;
  clerkId: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

/* =============================
   COMPONENT
============================= */
export default function StoreItemPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"create" | "update">("create");
  const [loadingItems, setLoadingItems] = useState(false);

  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clerks, setClerks] = useState<ClerkOption[]>([]);

  const [search, setSearch] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [bulkClerkId, setBulkClerkId] = useState("");
  const [applyClerkToAll, setApplyClerkToAll] = useState(true);
  const [clerkSearch, setClerkSearch] = useState("");
  const [showClerkDropdown, setShowClerkDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  /* =============================
     LOAD MASTER DATA
  ============================= */
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories);
    fetch("/api/clerks").then(r => r.json()).then(setClerks);
  }, []);

  /* =============================
     CLERK FILTER
  ============================= */
  const filteredClerks = useMemo(() => {
    return clerks.filter(c =>
      c.label.toLowerCase().includes(clerkSearch.toLowerCase())
    );
  }, [clerks, clerkSearch]);

  /* =============================
     DUPLICATE & VALIDATION
  ============================= */
  const duplicateNames = useMemo(() => {
    const names = items.map(i => i.name.trim().toLowerCase());
    return names.filter((n, i) => names.indexOf(n) !== i);
  }, [items]);

  const hasErrors =
    items.some(i => !i.name.trim() || i.price == null || i.price <= 0) ||
    duplicateNames.length > 0;

  /* =============================
     FETCH EXISTING ITEMS
  ============================= */
  const fetchExistingItems = async () => {
    try {
      setLoadingItems(true);
      const res = await fetch("/api/menu/view");
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to load items");
        return;
      }

      setItems(
        data.map((i: any) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          categoryId: i.categoryId ?? null,
          clerkId: i.clerkId ?? null,
          imageUrl: i.imageUrl ?? null,
          isActive: i.isActive ?? true,
        }))
      );

      setMode("update");
      toast.success("Items loaded for update");
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoadingItems(false);
    }
  };

  /* =============================
     ENSURE CATEGORY
  ============================= */
  const ensureCategory = async (name: string) => {
    const res = await fetch("/api/categories/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const cat = await res.json();
    setCategories(prev =>
      prev.some(c => c.id === cat.id) ? prev : [...prev, cat]
    );
    return cat;
  };

  /* =============================
     FILE UPLOAD (CSV + EXCEL)
  ============================= */
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // smooth fake progress while parsing
      const progressTimer = setInterval(() => {
        setUploadProgress((p) => (p < 90 ? p + 5 : p));
      }, 150);

      if (file.name.endsWith(".csv")) {
        const Papa = (await import("papaparse")).default;

        Papa.parse(file, {
          header: true,
          complete: async (result) => {
            clearInterval(progressTimer);
            await processRows(result.data as any[]);
            setUploadProgress(100);
          },
        });
      } else {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        clearInterval(progressTimer);
        await processRows(rows);
        setUploadProgress(100);
      }

      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch {
      setUploading(false);
      setUploadProgress(0);
      toast.error("File upload failed");
    }
  };


  const processRows = async (rows: any[]) => {
    const newItems: StoreItem[] = [];
    const total = rows.length;

    for (let i = 0; i < total; i++) {
      const row = rows[i];

      const name = String(row.name || row.Name || "").trim();
      if (!name) continue;

      let categoryId: string | null = null;
      if (row.category || row.Category) {
        const cat = await ensureCategory(row.category || row.Category);
        categoryId = cat.id;
      }

      newItems.push({
        name,
        price: Number(row.price || row.Price || 0),
        categoryId,
        clerkId: userId ?? null,
        imageUrl: null,
        isActive: true,
      });

      // real progress based on rows
      setUploadProgress(Math.min(95, Math.round(((i + 1) / total) * 100)));
    }

    setItems(newItems);
    setMode("create");
    toast.success(`Loaded ${newItems.length} items`);
  };

  /* =============================
     IMAGE UPLOAD
  ============================= */
  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    if (!res.ok) throw new Error();
    return (await res.json()).url;
  };

  const handleImageFile = async (file: File, index: number) => {
    try {
      const url = await uploadImage(file);
      setItems(prev =>
        prev.map((it, i) => (i === index ? { ...it, imageUrl: url } : it))
      );
    } catch {
      toast.error("Image upload failed");
    }
  };

  /* =============================
      ADD MANUAL ITEM             
  ============================= */
  const addManualItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        price: null,
        categoryId: null,
        clerkId: userId ?? null,
        imageUrl: null,
        isActive: true,
      },
    ]);

    // keep mode consistent
    if (mode !== "create") {
      setMode("create");
    }
  };


  /* =============================
     SAVE / UPDATE
  ============================= */
  const saveItems = async () => {
    const res = await fetch("/api/store-items/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.error || "Save failed");
      return false;
    }

    toast.success(`${data.insertedCount} items saved successfully`);
    return true;
  };


  const updateItems = async () => {
    const validItems = items.filter(
      i => i.id && i.name.trim() && i.price != null
    );

    if (!validItems.length) {
      toast.error("No valid items to update");
      return false;
    }

    const res = await fetch("/api/store-items/bulk-update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: validItems }),
    });

    if (!res.ok) {
      toast.error("Update failed");
      return false;
    }

    toast.success("Items updated successfully");
    return true;
  };

  const handleSave = async () => {
    if (saving) return;

    if (!items.length) {
      toast.error("No items");
      return;
    }

    if (hasErrors) {
      toast.error(
        mode === "update"
          ? "Fix highlighted rows before updating"
          : "Fix errors before saving"
      );
      return;
    }

    try {
      setSaving(true);

      let success = false;

      if (mode === "create") {
        success = await saveItems();
      } else {
        success = await updateItems();
      }

      if (success) {
        router.push("/menu/view");
      }
    } finally {
      setSaving(false);
    }
  };
  /* =============================
     SEARCH FILTER
  ============================= */


  const displayedItems = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;



  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    setDragIndex(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }

    await handleImageFile(file, index);
  };

  const isRowInvalid = (item: StoreItem) => {
    // only highlight during UPDATE
    if (mode !== "update") return false;

    // only existing items
    if (!item.id) return false;

    if (!item.name.trim()) return true;
    if (item.price == null) return true;

    return false;
  };


  /* =============================
     RENDER
  ============================= */
  return (
    <div className="p-6 space-y-8 bg-[var(--kravy-bg)] min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[var(--kravy-text-primary)] tracking-tight">Bulk Menu Upload</h1>
          <p className="text-sm font-medium text-[var(--kravy-text-muted)] mt-1">
            {mode === "create" ? "Bulk create items with spreadsheet upload" : "Edit and update your live menu items"}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={fetchExistingItems} className="px-5 py-2.5 bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] rounded-xl font-bold hover:border-[var(--kravy-brand)] transition-all flex items-center gap-2" >
            Sync Existing
          </button>
          <button
            onClick={() => {
              setItems([]);
              setMode("create");
            }}
            className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl font-bold hover:bg-rose-500/20 transition-all"
          >
            Clear Sheet
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Rows", value: items.length, icon: "📋" },
          { label: "Duplicates", value: duplicateNames.length, icon: "⚠️", color: duplicateNames.length > 0 ? "text-rose-500" : "" },
          { label: "Operation Mode", value: mode.toUpperCase(), icon: "⚡" },
          { label: "Ready to Save", value: hasErrors ? "No" : "Yes", icon: "✅", color: hasErrors ? "text-rose-500" : "text-emerald-500" }
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)]">{stat.label}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className={`text-xl font-black mt-1 ${stat.color || "text-[var(--kravy-text-primary)]"}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-4 items-center bg-[var(--kravy-surface)] p-5 rounded-2xl border border-[var(--kravy-border)]">
        <div className="flex-1 min-w-[300px] relative">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            disabled={uploading}
            onChange={(e) =>
              e.target.files && handleFileUpload(e.target.files[0])
            }
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-[var(--kravy-border)] rounded-xl py-4 hover:border-[var(--kravy-brand)] hover:bg-[var(--kravy-brand)]/5 transition-all cursor-pointer text-[var(--kravy-text-primary)] font-bold group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">📂</span>
            {uploading ? "Uploading Spreadsheet..." : "Click to Upload CSV / Excel"}
          </label>
        </div>

        <div className="flex-1 min-w-[250px] relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          <input
            className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] font-semibold h-14 pl-12 pr-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all"
            placeholder="Filter spreadsheet rows..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={addManualItem}
          className="h-14 px-8 bg-[var(--kravy-brand)] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-[var(--kravy-brand)]/30 active:scale-95 transition-all"
        >
          + Add Manual Row
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl shadow-xl">
        <table className="min-w-[1100px] w-full text-sm border-collapse">
          <thead className="bg-[var(--kravy-bg-2)]/50">
            <tr>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-[var(--kravy-text-muted)] text-left">Item Image</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-[var(--kravy-text-muted)] text-left">Product Name</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-[var(--kravy-text-muted)] text-left">Sell Price</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-[var(--kravy-text-muted)] text-left">Category</th>

              {/* CLERK HEADER DROPDOWN */}
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-[var(--kravy-text-muted)] text-left relative">
                Clerk Assignment
                <input
                  className="mt-2 w-full bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-lg px-3 py-2 text-xs font-semibold text-[var(--kravy-text-primary)] outline-none focus:ring-1 focus:ring-[var(--kravy-brand)]"
                  placeholder="Assign to..."
                  value={clerkSearch}
                  onFocus={() => setShowClerkDropdown(true)}
                  onChange={(e) => setClerkSearch(e.target.value)}
                />

                {showClerkDropdown && (
                  <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto bg-[var(--kravy-surface-2)] border border-[var(--kravy-border-strong)] rounded-xl shadow-2xl backdrop-blur-xl">
                    {filteredClerks.map((c) => (
                      <div
                        key={c.clerkId}
                        className="px-4 py-2.5 text-xs font-bold text-[var(--kravy-text-primary)] cursor-pointer hover:bg-[var(--kravy-brand)]/10 hover:text-[var(--kravy-brand)] transition-colors border-b border-[var(--kravy-border)] last:border-0"
                        onClick={() => {
                          setBulkClerkId(c.clerkId);
                          setItems((prev) =>
                            prev.map((it) => ({
                              ...it,
                              clerkId: c.clerkId,
                            }))
                          );
                          setShowClerkDropdown(false);
                          setClerkSearch(c.label);
                        }}
                      >
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-[var(--kravy-text-muted)] text-center">Status</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-rose-500 text-center">Delete</th>
            </tr>
          </thead>

          <tbody>
            {displayedItems.map((item, i) => (
              <tr
                key={item.id ?? i}
                className="border-t border-[var(--kravy-border)] hover:bg-[var(--kravy-table-row-hover)] transition-colors group"
              >

                {/* IMAGE */}
                {/* IMAGE */}
                <td className="py-4 px-6">
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDragEnter={() => setDragIndex(i)}
                    onDragLeave={() => setDragIndex(null)}
                    onDrop={e => handleDrop(e, i)}
                    className={`w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-[var(--kravy-bg-2)] flex items-center justify-center border transition-all ${dragIndex === i ? "border-[var(--kravy-brand)] bg-[var(--kravy-brand)]/10" : "border-[var(--kravy-border)]"
                      }`}
                  >
                    <label className="w-full h-full flex items-center justify-center cursor-pointer">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--kravy-text-muted)] text-center px-1">
                          {item.imageUrl ? "Update" : "Drop Img"}
                        </span>
                      )}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={e =>
                          e.target.files &&
                          handleImageFile(e.target.files[0], i)
                        }
                      />
                    </label>
                  </div>

                  {/* 🔹 IMAGE URL PASTE (NEW) */}
                  <input
                    type="text"
                    placeholder="Paste URL..."
                    className="mt-2 w-28 text-[10px] bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-md px-2 py-1 text-[var(--kravy-text-primary)] outline-none focus:border-[var(--kravy-brand)]"
                    value={item.imageUrl ?? ""}
                    onChange={(e) =>
                      setItems(prev =>
                        prev.map((it, idx) =>
                          idx === i
                            ? { ...it, imageUrl: e.target.value }
                            : it
                        )
                      )
                    }
                  />
                </td>

                {/* NAME */}
                {/* NAME */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <input
                      className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-lg px-3 py-2 w-full text-sm font-bold text-[var(--kravy-text-primary)] outline-none focus:ring-1 focus:ring-[var(--kravy-brand)]"
                      value={item.name}
                      onChange={e =>
                        setItems(prev =>
                          prev.map((it, idx) =>
                            idx === i
                              ? { ...it, name: e.target.value }
                              : it
                          )
                        )
                      }
                    />

                    {/* 🔹 COPY NAME */}
                    <button
                      type="button"
                      className="p-2 text-xs bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-lg hover:text-[var(--kravy-brand)] hover:border-[var(--kravy-brand)]/50 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(item.name);
                        toast.success("Copied!");
                      }}
                      title="Copy"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </td>

                {/* PRICE */}
                <td className="py-4 px-6">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] font-bold text-xs">₹</span>
                    <input
                      type="number"
                      className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-lg pl-6 pr-3 py-2 w-full text-sm font-black text-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500"
                      value={item.price ?? ""}
                      onChange={e =>
                        setItems(prev =>
                          prev.map((it, idx) =>
                            idx === i
                              ? {
                                ...it,
                                price: Number(e.target.value),
                              }
                              : it
                          )
                        )
                      }
                    />
                  </div>
                </td>

                {/* CATEGORY */}
                <td className="py-4 px-6">
                  <select
                    className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-lg px-3 py-2 w-full text-xs font-bold text-[var(--kravy-text-primary)] outline-none focus:ring-1 focus:ring-[var(--kravy-brand)]"
                    value={item.categoryId ?? ""}
                    onChange={e =>
                      setItems(prev =>
                        prev.map((it, idx) =>
                          idx === i
                            ? { ...it, categoryId: e.target.value }
                            : it
                        )
                      )
                    }
                  >
                    <option value="">Select</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__new__">+ Add new category</option>
                  </select>
                </td>

                {/* CLERK (ROW) */}
                <td className="py-4 px-6">
                  <select
                    className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-lg px-3 py-2 w-full text-xs font-bold text-[var(--kravy-text-primary)] outline-none focus:ring-1 focus:ring-[var(--kravy-brand)]"
                    value={item.clerkId || ""}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, clerkId: e.target.value } : it
                        )
                      )
                    }
                  >
                    <option value="">Select clerk</option>
                    {clerks.map((c) => (
                      <option key={c.clerkId} value={c.clerkId}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-md border-[var(--kravy-border)] text-[var(--kravy-brand)] focus:ring-[var(--kravy-brand)]/20 cursor-pointer"
                      checked={item.isActive}
                      onChange={e =>
                        setItems(prev =>
                          prev.map((it, idx) =>
                            idx === i
                              ? { ...it, isActive: e.target.checked }
                              : it
                          )
                        )
                      }
                    />
                  </div>
                </td>

                <td className="py-4 px-6 text-center">
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all mx-auto"
                    onClick={() =>
                      setItems(prev =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {
        hasErrors && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">🛑</span>
            <p className="text-rose-500 text-sm font-bold uppercase tracking-widest">
              Critical Error: Fix highlighed rows (Name/Price missing) before proceeding.
            </p>
          </div>
        )
      }

      <button
        onClick={handleSave}
        disabled={hasErrors || saving}
        className={`w-full max-w-sm mx-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 ${hasErrors || saving
          ? "bg-[var(--kravy-border)] text-[var(--kravy-text-muted)] cursor-not-allowed"
          : "bg-[var(--kravy-brand)] text-white hover:shadow-[var(--kravy-brand)]/40 hover:-translate-y-1"
          }`}
      >
        {saving && (
          <RefreshCw size={20} className="animate-spin" />
        )}

        {mode === "create"
          ? saving
            ? "Saving Menu Data..."
            : "Save to Digital Menu"
          : saving
            ? "Syncing Updates..."
            : "Sync Menu Updates"}
      </button>
      {
        uploading && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-[320px] text-center space-y-4">
              <p className="font-medium">Uploading items…</p>

              <div className="w-full h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-blue-600 rounded transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <p className="text-sm text-gray-500">
                {uploadProgress}% completed
              </p>
            </div>
          </div>
        )
      }


    </div>
  );
}
