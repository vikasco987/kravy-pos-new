"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
    <div className="p-4 space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Store Item Upload</h1>
          <p className="text-sm text-gray-500">
            {mode === "create" ? "Bulk create items" : "Update existing items"}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchExistingItems} className=" px-4 py-2 bg-blue-500 bordertext-white rounded-2xl text-white hover:bg-blue-600" >
            Update
          </button>
          <button
            onClick={() => {
              setItems([]);
              setMode("create");
            }}
            className="px-4 py-2 bg-blue-500 bordertext-white rounded-2xl text-white hover:bg-blue-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="flex gap-6 text-sm text-gray-600">
        <span>Total: <b>{items.length}</b></span>
        <span>Duplicates: <b>{duplicateNames.length}</b></span>
        <span>Mode: <b>{mode}</b></span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4 items-center">
    <input
      type="file"
      accept=".xlsx,.xls,.csv"
      disabled={uploading}
      onChange={(e) =>
        e.target.files && handleFileUpload(e.target.files[0])
      }
      className="border px-3 py-2 disabled:opacity-50"
    />

    <input
      className="border px-3 py-2"
      placeholder="Search item"
      value={search}
      onChange={e => setSearch(e.target.value)}
    />

  {/* ➕ MANUAL ADD ITEM */}
  <button
    type="button"
    onClick={addManualItem}
    className="px-4 py-2 border rounded bg-blue-500 hover:bg-blue-600 text-white"
  >
    + Add Item
  </button>
</div>
            
            {/* TABLE */}
      <div className="overflow-x-auto border rounded bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Category</th>

              {/* CLERK HEADER DROPDOWN */}
             <th className="p-3 text-left relative">
  <span className="text-xs font-medium text-gray-600">
    Assigned Clerk
  </span>

  <input
    className="mt-1 w-full border rounded px-2 py-1 text-sm"
    placeholder="Search clerk"
    value={clerkSearch}
    onFocus={() => setShowClerkDropdown(true)}
    onChange={(e) => setClerkSearch(e.target.value)}
  />

  {showClerkDropdown && (
    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto border bg-white rounded shadow">
      {filteredClerks.map((c) => (
        <div
          key={c.clerkId}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
          onClick={() => {
            setBulkClerkId(c.clerkId);

            // ✅ apply to all rows
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
          {c.label}
          </div>
        ))}

                {filteredClerks.length === 0 && (
                   <div className="px-3 py-2 text-sm text-gray-400">
                    No clerk found
                  </div>
                )}
              </div>
            )}
            </th>
        
              <th className="p-3">Active</th>
              <th className="p-3">Delete</th>
            </tr>
          </thead>

          <tbody>
            {displayedItems.map((item, i) => (
              <tr
                key={item.id ?? i}
                className={`border-t ${
                  isRowInvalid(item)
                    ? "bg-red-50 border-red-300"
                    : ""
                }`}
              >

                {/* IMAGE */}
               {/* IMAGE */}
<td className="p-3">
  <div
    onDragOver={e => e.preventDefault()}
    onDragEnter={() => setDragIndex(i)}
    onDragLeave={() => setDragIndex(null)}
    onDrop={e => handleDrop(e, i)}
    className={`w-16 h-16 border rounded flex items-center justify-center ${
      dragIndex === i ? "border-blue-500 bg-blue-50" : ""
    }`}
  >
    <label className="w-full h-full flex items-center justify-center cursor-pointer">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="text-xs text-gray-400">
          Drop / Click
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
    placeholder="Paste image URL"
    className="mt-2 w-32 text-xs border rounded px-2 py-1"
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
<td className="p-3">
  <div className="flex items-center gap-2">
    <input
      className="border rounded px-2 py-1 w-full"
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
      className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
      onClick={() => {
        navigator.clipboard.writeText(item.name);
        toast.success("Item name copied");
      }}
      title="Copy item name"
    >
      Copy
    </button>
  </div>
</td>

                {/* PRICE */}
                <td className="p-3">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
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
                </td>

                {/* CATEGORY */}
                <td className="p-3">
                  <select
                    className="border rounded px-2 py-1 w-full"
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
                <td className="p-3">
  <select
    className="border rounded px-2 py-1 w-full text-sm"
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


                {/* ACTIVE */}
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
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
                </td>

                {/* DELETE */}
                <td className="p-3 text-center">
                  <button
                    className="text-red-600"
                    onClick={() =>
                      setItems(prev =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasErrors && (
        <p className="text-red-600 text-sm">
          Please fill item name and price before saving.
        </p>
      )}

     <button
      onClick={handleSave}
      disabled={hasErrors || saving}
      className="px-6 py-3 bg-blue-600 text-white rounded
                flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving && (
        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}

      {mode === "create"
        ? saving
          ? "Saving..."
          : "Save Items"
        : saving
        ? "Updating..."
        : "Update Items"}
    </button>
{uploading && (
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
)}


    </div>
  );
}
